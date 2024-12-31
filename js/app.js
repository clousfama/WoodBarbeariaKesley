document.addEventListener('DOMContentLoaded', function() {
    function toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
    }

    // Close menu when clicking on a link (mobile)
    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('show');
            }
        });
    });

    // Close menu when clicking outside (mobile)
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuButton = document.querySelector('.menu-button');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuButton.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });

    document.getElementById('appointmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.querySelector('input[type="text"]').value;
        const whatsapp = document.querySelector('input[type="tel"]').value;
        const service = document.querySelector('select').value;
        const serviceText = document.querySelector('select option:checked').text;
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('timeSlots').value;

        // Validação básica
        if (!name || !whatsapp || !service || !date || !time) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        const appointmentData = {
            name,
            whatsapp,
            service,
            serviceText,
            date,
            time,
            formattedDate: new Date(date).toLocaleDateString('pt-BR')
        };

        function saveAppointmentToStorage(appointmentData) {
            let appointments = JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]');
            
            appointments.push({
                ...appointmentData,
                id: Date.now(),
                createdAt: new Date().toISOString()
            });
            
            appointments.sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.time);
                const dateB = new Date(b.date + 'T' + b.time);
                return dateA - dateB;
            });
            
            localStorage.setItem('woodBarbeariaAppointments', JSON.stringify(appointments));
        }

        saveAppointmentToStorage(appointmentData);

        const formattedDate = new Date(date).toLocaleDateString('pt-BR');
        
        const clientMessage = `
*Agendamento Confirmado!*

Olá ${name},

Seu agendamento foi confirmado com sucesso!

*Detalhes do agendamento:*
- Serviço: ${serviceText}
- Data: ${formattedDate}
- Horário: ${time}

*Local:*
Wood Barbearia
Rua Pinto Alves, 596 - Vila Santa Cecília
Lagoa Santa/MG - CEP: 33230-222

Em caso de dúvidas, entre em contato:
Telefone: (31) 99298-4248

Agradecemos a preferência!`;
        
        const ownerMessage = `
*Novo Agendamento!*

*Detalhes do cliente:*
Nome: ${name}
WhatsApp: ${whatsapp}

*Serviço agendado:*
${serviceText}

Data: ${formattedDate}
Horário: ${time}`;

        const formattedClientPhone = whatsapp.replace(/\D/g, '');
        const clientPhoneWithCountryCode = `55${formattedClientPhone}`;
        const ownerPhone = '5531992984248';

        const clientWhatsAppLink = `https://wa.me/${clientPhoneWithCountryCode}?text=${encodeURIComponent(clientMessage)}`;
        const ownerWhatsAppLink = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(ownerMessage)}`;

        window.open(clientWhatsAppLink, '_blank');
        window.open(ownerWhatsAppLink, '_blank');

        alert('Agendamento realizado com sucesso! As mensagens de confirmação serão enviadas via WhatsApp.');
        
        e.target.reset();
        generateTimeSlots(); // Atualiza os horários após o agendamento
    });

    function generateTimeSlots() {
        const select = document.getElementById('timeSlots');
        const dateInput = document.getElementById('appointmentDate');
        
        if (!dateInput || !select) {
            console.error('Elementos de formulário não encontrados');
            return;
        }
        
        if (!dateInput.value) {
            select.innerHTML = '<option value="">Selecione uma data primeiro</option>';
            return;
        }

        const selectedDate = new Date(dateInput.value + 'T00:00:00');
        const dayOfWeek = selectedDate.getDay();

        console.log('Data selecionada:', selectedDate.toLocaleDateString(), 'Dia da semana:', dayOfWeek);

        select.innerHTML = '<option value="">Selecione um horário</option>';

        // Verifica se a data é anterior a hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            select.innerHTML = '<option value="">Data inválida</option>';
            console.log('Data selecionada é anterior a hoje');
            return;
        }

        // Get existing appointments for the selected date
        const appointments = JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]');
        const dateString = dateInput.value;
        const bookedTimes = appointments
            .filter(app => app.date === dateString)
            .map(app => app.time);

        console.log('Horários já agendados:', bookedTimes);

        if (dayOfWeek === 0) { 
            select.innerHTML = '<option value="">Não atendemos aos domingos</option>';
            console.log('Domingo selecionado - não há atendimento');
            return;
        }

        const timeSlots = [];
        const isSaturday = dayOfWeek === 6;

        if (isSaturday) {
            // Horários de sábado (8:30 - 17:00)
            const slots = [
                '08:30', '09:10', '09:50', '10:30', '11:10', '11:50',
                '12:30', '13:10', '13:50', '14:30', '15:10', '15:50', '16:30'
            ];
            timeSlots.push(...slots);
            console.log('Horários de sábado gerados');
        } else {
            // Horários de segunda a sexta (8:00 - 19:00)
            const slots = [
                '08:00', '08:40', '09:20', '10:00', '10:40', '11:20',
                '12:00', '12:40', '13:20', '14:00', '14:40', '15:20',
                '16:00', '16:40', '17:20', '18:00', '18:40'
            ];
            timeSlots.push(...slots);
            console.log('Horários de dia de semana gerados');
        }

        // Se for hoje, remove horários já passados
        if (selectedDate.toDateString() === new Date().toDateString()) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            timeSlots.forEach(timeSlot => {
                if (!bookedTimes.includes(timeSlot)) {
                    const [hours, minutes] = timeSlot.split(':').map(Number);
                    if (hours > currentHour || (hours === currentHour && minutes > currentMinute + 30)) {
                        const option = document.createElement('option');
                        option.value = timeSlot;
                        option.textContent = timeSlot;
                        select.appendChild(option);
                    }
                }
            });
        } else {
            // Para outros dias, mostra todos os horários não agendados
            timeSlots.forEach(timeSlot => {
                if (!bookedTimes.includes(timeSlot)) {
                    const option = document.createElement('option');
                    option.value = timeSlot;
                    option.textContent = timeSlot;
                    select.appendChild(option);
                }
            });
        }

        // Se não houver horários disponíveis
        if (select.options.length === 1) {
            select.innerHTML = '<option value="">Não há horários disponíveis nesta data</option>';
        }
    }

    // Inicializa e configura o campo de data
    function initializeDateTime() {
        const dateInput = document.getElementById('appointmentDate');
        if (!dateInput) {
            console.error('Campo de data não encontrado');
            return;
        }

        try {
            // Define a data mínima e inicial como hoje
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            
            // Configura o campo de data
            dateInput.setAttribute('type', 'date'); // Garante que o tipo está correto
            dateInput.setAttribute('min', todayString);
            dateInput.value = todayString;
            console.log('Data inicial definida:', todayString);
            
            // Gera os horários iniciais
            generateTimeSlots();

            // Adiciona evento para mudança de data via seleção ou digitação
            dateInput.addEventListener('change', function(e) {
                console.log('Data alterada:', this.value);
                generateTimeSlots();
            });

            // Adiciona evento para quando o campo perde o foco
            dateInput.addEventListener('blur', function() {
                if (!this.value) {
                    this.value = todayString; // Restaura para hoje se estiver vazio
                }
                generateTimeSlots();
            });

            // Adiciona evento para quando o campo recebe foco
            dateInput.addEventListener('focus', function() {
                if (!this.value) {
                    this.value = todayString;
                }
                generateTimeSlots();
            });

            // Força a atualização inicial dos horários após um breve delay
            setTimeout(() => {
                if (!dateInput.value) {
                    dateInput.value = todayString;
                }
                generateTimeSlots();
            }, 500);
        } catch (error) {
            console.error('Erro ao inicializar o campo de data:', error);
        }
    }

    // Garante que o código só é executado após o DOM estar completamente carregado
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM carregado, inicializando campo de data...');
        initializeDateTime();
    });

    // Funções para visualização de agendamentos
    window.viewAppointments = function() {
        const appointments = JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]');
        
        let appointmentsHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="appointmentsModal">
                <div class="bg-woodDark p-4 sm:p-8 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl sm:text-2xl font-bold text-woodGold">Agenda de Agendamentos</h2>
                        <div class="text-sm text-gray-400">
                            Total: ${appointments.length} agendamentos
                        </div>
                    </div>
                    
                    ${addFilterControls()}
                    
                    <div class="space-y-4" id="appointmentsList">
                        ${generateAppointmentsList(appointments)}
                    </div>
                    
                    <div class="mt-6 flex justify-between">
                        <button onclick="exportAppointments()" 
                                class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                            Exportar para Excel
                        </button>
                        <button onclick="document.getElementById('appointmentsModal').remove()" 
                                class="bg-woodGold text-black px-4 py-2 rounded hover:bg-yellow-600 transition">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', appointmentsHTML);

        // Adiciona eventos de filtro após criar o modal
        const searchInput = document.getElementById('searchAppointments');
        const filterDate = document.getElementById('filterDate');
        
        if (searchInput) {
            searchInput.addEventListener('input', filterAppointments);
        }
        if (filterDate) {
            filterDate.addEventListener('change', filterAppointments);
        }
    };

    function addFilterControls() {
        return `
            <div class="mb-4 flex flex-wrap gap-4">
                <input type="text" 
                       id="searchAppointments" 
                       placeholder="Buscar por nome ou serviço" 
                       class="p-2 bg-gray-800 rounded flex-grow">
                <input type="date" 
                       id="filterDate" 
                       class="p-2 bg-gray-800 rounded">
                <button onclick="clearFilters()" 
                        class="bg-woodGold text-black px-4 py-2 rounded hover:bg-yellow-600 transition">
                    Limpar Filtros
                </button>
            </div>
        `;
    }

    function getAppointmentStatus(appointment) {
        const now = new Date();
        const appointmentDate = new Date(appointment.date + 'T' + appointment.time);
        
        if (appointmentDate < now) {
            return '<span class="text-gray-500">Finalizado</span>';
        } else if (appointmentDate.toDateString() === now.toDateString()) {
            return '<span class="text-green-500">Hoje</span>';
        }
        return '<span class="text-blue-500">Agendado</span>';
    }

    function generateAppointmentsList(appointments) {
        if (!appointments.length) {
            return '<p class="text-center text-gray-400">Nenhum agendamento encontrado</p>';
        }

        return appointments.map(appointment => `
            <div class="border-b border-gray-700 pb-2">
                <p class="font-bold">${appointment.time} - ${appointment.name}</p>
                <p class="text-sm text-gray-400">Serviço: ${appointment.serviceText}</p>
                <p class="text-sm text-gray-400">Data: ${appointment.formattedDate}</p>
                <p class="text-sm text-gray-400">Contato: ${appointment.whatsapp}</p>
                <p class="text-sm text-gray-400">Status: ${getAppointmentStatus(appointment)}</p>
            </div>
        `).join('');
    }

    window.clearFilters = function() {
        const searchInput = document.getElementById('searchAppointments');
        const filterDate = document.getElementById('filterDate');
        if (searchInput) searchInput.value = '';
        if (filterDate) filterDate.value = '';
        
        const appointments = JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]');
        const appointmentsList = document.getElementById('appointmentsList');
        if (appointmentsList) {
            appointmentsList.innerHTML = generateAppointmentsList(appointments);
        }
    };

    window.exportAppointments = function() {
        const appointments = JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]');
        let csv = 'Data,Horário,Nome,Serviço,Contato\n';
        
        appointments.forEach(app => {
            csv += `${app.formattedDate},${app.time},"${app.name}","${app.serviceText}",${app.whatsapp}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'agendamentos.csv');
        a.click();
    };

    function filterAppointments() {
        const searchInput = document.getElementById('searchAppointments');
        const filterDate = document.getElementById('filterDate');
        const appointmentsList = document.getElementById('appointmentsList');
        
        if (!appointmentsList) return;

        const appointments = JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]');
        let filtered = [...appointments];

        // Filtro por texto
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filtered = filtered.filter(app => 
                app.name.toLowerCase().includes(searchTerm) ||
                app.serviceText.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro por data
        if (filterDate && filterDate.value) {
            filtered = filtered.filter(app => app.date === filterDate.value);
        }

        appointmentsList.innerHTML = generateAppointmentsList(filtered);
    }

    // Expõe a função toggleMenu globalmente
    window.toggleMenu = toggleMenu;
});
