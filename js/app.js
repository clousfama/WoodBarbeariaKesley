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
                    const dateA = new Date(a.date + ' ' + a.time);
                    const dateB = new Date(b.date + ' ' + b.time);
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
        });

        function generateTimeSlots() {
            const select = document.getElementById('timeSlots');
            const dateInput = document.getElementById('appointmentDate');
            const selectedDate = new Date(dateInput.value);
            const dayOfWeek = selectedDate.getUTCDay();

            select.innerHTML = '<option value="">Selecione um horário</option>';

            // Get existing appointments for the selected date
            const appointments = JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]');
            const dateString = selectedDate.toISOString().split('T')[0];
            const bookedTimes = appointments
                .filter(app => app.date === dateString)
                .map(app => app.time);

            if (dayOfWeek === 0) { 
                select.innerHTML = '<option value="">Não atendemos aos domingos</option>';
                return;
            }

            const isSaturday = dayOfWeek === 6;
            let timeSlots = [];

            if (isSaturday) {
                // Saturday time slots with 40-minute intervals
                timeSlots = [
                    '08:30', '09:10', '09:50', '10:30', '11:10', '11:50',
                    '12:30', '13:10', '13:50', '14:30', '15:10', '15:50', '16:30'
                ];
            } else {
                // Weekday time slots with 40-minute intervals
                let time = new Date(selectedDate);
                time.setHours(8, 0, 0); // Start at 08:00
                const endTime = new Date(selectedDate);
                endTime.setHours(19, 0, 0); // End at 19:00

                while (time < endTime) {
                    timeSlots.push(time.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                    }));
                    time.setMinutes(time.getMinutes() + 40);
                }
            }

            // Add available time slots to select element
            timeSlots.forEach(timeSlot => {
                if (!bookedTimes.includes(timeSlot)) {
                    const option = document.createElement('option');
                    option.value = timeSlot;
                    option.textContent = timeSlot;
                    select.appendChild(option);
                }
            });

            // If no slots are available, show message
            if (select.options.length === 1) {
                select.innerHTML = '<option value="">Não há horários disponíveis nesta data</option>';
            }
        }

        document.getElementById('appointmentDate').addEventListener('change', generateTimeSlots);

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDate').min = today;

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
            const appointmentDate = new Date(appointment.date + ' ' + appointment.time);
            
            if (appointmentDate < now) {
                return '<span class="text-gray-500">Finalizado</span>';
            } else if (appointmentDate.toDateString() === now.toDateString()) {
                return '<span class="text-green-500">Hoje</span>';
            }
            return '<span class="text-blue-500">Agendado</span>';
        }

        function viewAppointments() {
            const appointments = JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]');
            
            let appointmentsHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="appointmentsModal">
                    <div class="bg-woodDark p-4 sm:p-8 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-xl sm:text-2xl font-bold text-woodGold">Agenda de Appointments</h2>
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
        }

        function exportAppointments() {
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
        }

        function generateAppointmentsList(appointments) {
            let appointmentsListHTML = '';
            
            appointments.forEach(appointment => {
                appointmentsListHTML += `
                    <div class="border-b border-gray-700 pb-2">
                        <p class="font-bold">${appointment.time} - ${appointment.name}</p>
                        <p class="text-sm text-gray-400">Serviço: ${appointment.serviceText}</p>
                        <p class="text-sm text-gray-400">Contato: ${appointment.whatsapp}</p>
                        <p class="text-sm text-gray-400">Status: ${getAppointmentStatus(appointment)}</p>
                    </div>
                `;
            });
            
            return appointmentsListHTML;
        }

        function clearFilters() {
            document.getElementById('searchAppointments').value = '';
            document.getElementById('filterDate').value = '';
            const appointmentsList = document.getElementById('appointmentsList');
            appointmentsList.innerHTML = generateAppointmentsList(JSON.parse(localStorage.getItem('woodBarbeariaAppointments') || '[]'));
        }
    </script>

</body></html> 