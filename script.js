import confetti from 'canvas-confetti';

document.addEventListener('DOMContentLoaded', () => {
    // --- Sound Effects ---
    let audioContext;
    let clickBuffer;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            fetch('click.mp3')
                .then(response => response.arrayBuffer())
                .then(data => audioContext.decodeAudioData(data))
                .then(buffer => {
                    clickBuffer = buffer;
                })
                .catch(e => console.error("Error with decoding audio data", e));
        }
    }

    function playSound(buffer) {
        if (!audioContext || !buffer) return;
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    }

    // --- Map Logic ---
    let map;
    let marker;
    const locationInput = document.getElementById('location');

    // Customer-side notification check
    function checkCustomerNotifications() {
        const orderId = sessionStorage.getItem('lastTrackedOrderId');
        if (!orderId) return;

        const chats = JSON.parse(localStorage.getItem('chats')) || [];
        const chat = chats.find(c => c.orderId == orderId);

        const notificationArea = document.getElementById('notification-area');
        const badge = notificationArea.querySelector('.notification-badge');

        if (chat && chat.customerUnread > 0) {
            notificationArea.style.display = 'block';
            badge.style.display = 'block';
            badge.textContent = chat.customerUnread;
            notificationArea.onclick = () => {
                window.location.href = `track-order.html?id=${orderId}`;
            };
        } else {
             notificationArea.style.display = 'none';
        }
    }

    function initMap() {
        if (map) return;
        // Default coordinates (Riyadh)
        const initialCoords = [24.7136, 46.6753];
        
        // Dynamically import Leaflet only when needed
        import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js').then(L => {
            map = L.map('map').setView(initialCoords, 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            marker = L.marker(initialCoords, { draggable: true }).addTo(map);
            
            marker.on('dragend', function(event) {
                const position = marker.getLatLng();
                map.panTo(position);
                // Try to reverse geocode to get an address (requires a service, for now we just use lat/lng)
                locationInput.value = `https://maps.google.com/?q=${position.lat},${position.lng}`;
            });
        }).catch(err => console.error("Failed to load map library", err));
    }

    // --- Modal Logic ---
    const modal = document.getElementById('order-modal');
    const orderNowBtn = document.getElementById('order-now-btn');
    const closeBtn = document.querySelector('.close-btn');

    const form = document.getElementById('order-form');
    const steps = Array.from(form.querySelectorAll('.form-step'));
    const nextBtn = form.querySelector('.next-btn');
    const prevBtn = form.querySelector('.prev-btn');
    const submitBtn = form.querySelector('.submit-btn');
    
    let currentStep = 0;
    let selectedService = null;
    
    // Populate services in modal
    const servicesGrid = document.querySelector('.services-grid');
    const modalServicesGrid = document.getElementById('modal-services-grid');
    modalServicesGrid.innerHTML = servicesGrid.innerHTML;

    const modalServiceCards = modalServicesGrid.querySelectorAll('.service-card');

    modalServiceCards.forEach(card => {
        card.addEventListener('click', () => {
            playSound(clickBuffer);
            modalServiceCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedService = card.dataset.service;
            document.getElementById('service-error').style.display = 'none';
        });
    });

    function showModal() {
        initAudio();
        modal.style.display = 'flex';
        setTimeout(() => {
             modal.classList.add('active');
             // Initialize map when modal is shown and it's the right step
             if (currentStep === 1) { // The map is on step 2 (index 1)
                 initMap();
                 // A slight delay to ensure the map container is visible and sized correctly
                 setTimeout(() => map && map.invalidateSize(), 100);
             }
        }, 10);
    }

    function hideModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            resetForm();
        }, 300);
    }

    function resetForm() {
        form.reset();
        currentStep = 0;
        selectedService = null;
        modalServiceCards.forEach(c => c.classList.remove('selected'));
        showStep(0);
    }

    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        currentStep = stepIndex;
        updateNavButtons();
    }
    
    function updateNavButtons() {
        prevBtn.style.display = currentStep > 0 && currentStep < steps.length - 1 ? 'inline-block' : 'none';
        nextBtn.style.display = currentStep < steps.length - 2 ? 'inline-block' : 'none';
        submitBtn.style.display = currentStep === steps.length - 1 ? 'inline-block' : 'none';
        
        // Special case for step with map
        if (currentStep === 1) {
            initMap();
            setTimeout(() => map && map.invalidateSize(), 100);
        }

        if (currentStep === steps.length - 2) {
             nextBtn.style.display = 'inline-block';
             nextBtn.textContent = 'مراجعة الطلب';
        } else if (currentStep < steps.length - 1) {
            nextBtn.textContent = 'التالي';
        }
    }
    
    function validateStep(stepIndex) {
        const currentStepElement = steps[stepIndex];
        if (stepIndex === 0) {
            const serviceError = document.getElementById('service-error');
            if (!selectedService) {
                serviceError.style.display = 'block';
                return false;
            }
            serviceError.style.display = 'none';
            return true;
        }

        const inputs = currentStepElement.querySelectorAll('input[required], textarea[required]');
        for (const input of inputs) {
            if (!input.value.trim()) {
                input.style.border = '1px solid #dc3545';
                return false;
            } else {
                input.style.border = '1px solid #ccc';
            }
        }
        return true;
    }
    
    function populateSummary() {
        document.getElementById('summary-service').textContent = selectedService;
        document.getElementById('summary-location').textContent = document.getElementById('location').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        document.getElementById('summary-datetime').textContent = `${date} في ${time}`;
        document.getElementById('summary-name').textContent = document.getElementById('name').value;
        document.getElementById('summary-phone').textContent = document.getElementById('phone').value;
    }

    orderNowBtn.addEventListener('click', showModal);
    closeBtn.addEventListener('click', hideModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    nextBtn.addEventListener('click', () => {
        playSound(clickBuffer);
        if (validateStep(currentStep)) {
            if (currentStep === steps.length - 2) { // Before confirmation step
                populateSummary();
            }
            showStep(currentStep + 1);
        }
    });

    prevBtn.addEventListener('click', () => {
        playSound(clickBuffer);
        showStep(currentStep - 1);
    });

    // --- Toast Notification Logic ---
    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        playSound(clickBuffer);
        
        const orderId = Math.floor(1000 + Math.random() * 9000);

        // Save order to localStorage to be viewed by technicians
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const newOrder = {
            id: orderId,
            service: selectedService,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            datetime: `${document.getElementById('date').value} في ${document.getElementById('time').value}`,
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            status: 'new' // 'new', 'accepted', 'completed'
        };
        orders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Final confirmation logic
        const confirmationView = form.querySelector('.confirmation-view');
        form.querySelector('.modal-navigation').style.display = 'none';
        
        // Hide summary and show success message
        confirmationView.innerHTML = `
            <h4>تم إرسال طلبك بنجاح!</h4>
            <p>شكرًا لاستخدامك "فني". سيتم التواصل معك قريبًا.</p>
            <p>رقم الطلب الخاص بك هو: <strong>#${orderId}</strong></p>
            <a href="track-order.html?id=${orderId}" class="cta-button" style="margin-top: 15px; display: inline-block;">تتبع حالة طلبك</a>
        `;
        
        // Fun confetti effect
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
        });

        // Notify user about the new order via toast on the main page after modal closes
        setTimeout(() => {
            hideModal();
            // Storing the order ID allows us to check for notifications later
            sessionStorage.setItem('lastTrackedOrderId', orderId);
            showToast(`تم استلام طلبك #${orderId}. يمكنك تتبع حالته الآن.`);
        }, 4000);
    });

    // Initialize first step
    showStep(0);

    // Check for notifications on page load and periodically
    checkCustomerNotifications();
    setInterval(checkCustomerNotifications, 5000);
});