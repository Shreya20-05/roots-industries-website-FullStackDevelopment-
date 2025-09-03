// static/animation.js
// This file contains JavaScript for dynamic interactions on the Roots Industries website.

document.addEventListener('DOMContentLoaded', () => {

    // --- Global Custom Message Box Logic ---
    const messageBox = document.getElementById('customMessageBox');
    const messageBoxTitle = document.getElementById('messageBoxTitle');
    const messageBoxContent = document.getElementById('messageBoxContent');
    const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

    /**
     * Displays a custom message box.
     * @param {string} title - The title of the message box.
     * @param {string} message - The content message.
     * @param {string} type - 'success' or 'error' to influence styling.
     */
    function showMessage(title, message, type) {
        if (!messageBox || !messageBoxTitle || !messageBoxContent) {
            console.error('Custom message box elements not found.');
            // Fallback to console log if message box elements are missing
            console.log(`Message: ${title} - ${message}`);
            return;
        }

        messageBoxTitle.textContent = title;
        messageBoxContent.textContent = message;

        // Reset and apply type-specific styling
        messageBox.classList.remove('bg-green-100', 'border-green-400', 'text-green-700', 'bg-red-100', 'border-red-400', 'text-red-700');
        messageBoxTitle.classList.remove('text-green-800', 'text-red-800');

        if (type === 'success') {
            messageBox.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
            messageBoxTitle.classList.add('text-green-800');
        } else if (type === 'error') {
            messageBox.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
            messageBoxTitle.classList.add('text-red-800');
        } else {
            // Default styling if no type or unknown type
            messageBox.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700');
            messageBoxTitle.classList.add('text-blue-800');
        }

        messageBox.classList.remove('hidden');
        document.body.classList.add('overflow-hidden'); // Prevent background scrolling
    }

    if (messageBoxCloseBtn) {
        messageBoxCloseBtn.addEventListener('click', () => {
            messageBox.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });
    }

    // --- Logo Pulse Animation ---
    const logo = document.querySelector('header img');
    if (logo) {
        logo.classList.add('logo-pulse');
    }

    // --- Contact Form Submission Handling (on contact.html) ---
    const contactForm = document.querySelector('#contact form');

    if (contactForm) { // Only run this block if the contact form exists on the page
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the default form submission (page reload)

            // Get form input values
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;

            // Basic client-side validation
            if (!name || !email || !message) {
                showMessage('Validation Error', 'Please fill in all fields before submitting.', 'error');
                return; // Stop the function if validation fails
            }

            // Create a simple loading indicator (e.g., disable button, show text)
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            try {
                // Send the form data to the Flask backend via POST request
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Indicate that we are sending JSON
                    },
                    body: JSON.stringify({ name, email, message }), // Convert data to JSON string
                });

                const result = await response.json(); // Parse the JSON response from the backend

                if (response.ok) {
                    // If the response status is 2xx (success)
                    showMessage('Success!', 'Thank you! Your message has been sent successfully.', 'success');
                    contactForm.reset(); // Clear the form fields
                } else {
                    // If the response status is an error (e.g., 4xx, 5xx)
                    showMessage('Submission Failed', `Failed to send message: ${result.error || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                // Handle network errors or issues reaching the server
                console.error('Error submitting contact form:', error);
                showMessage('Network Error', 'An error occurred while sending your message. Please try again later.', 'error');
            } finally {
                // Re-enable the button and restore its text
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    // --- Application Form Submission Handling (on application_request.html or careers.html) ---
    const applicationForm = document.getElementById('applicationForm');

    if (applicationForm) { // Only run this block if the application form exists on the page
        applicationForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            // Using FormData for easier handling of all fields, especially for potential file uploads
            const formData = new FormData(applicationForm);

            // Basic client-side validation for required fields
            const requiredFields = ['full_name', 'email', 'phone', 'dob', 'address', 'city', 'pincode', 'state_ut', 'position_applied', 'resume'];
            let allFieldsFilled = true;
            for (const fieldName of requiredFields) {
                if (!formData.get(fieldName)) {
                    allFieldsFilled = false;
                    break;
                }
            }
            if (!allFieldsFilled) {
                showMessage('Validation Error', 'Please fill in all required fields.', 'error');
                return;
            }

            
            const submitButton = applicationForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            try {
                // For file uploads, it's generally better to send FormData directly without JSON.stringify
                const response = await fetch('/api/apply', { // Endpoint for applications
                    method: 'POST',
                    body: formData, // Send FormData directly
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage('Success!', 'Your application has been submitted successfully!', 'success');
                    applicationForm.reset(); // Clear the form
                } else {
                    showMessage('Submission Failed', `Failed to submit application: ${result.error || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Error submitting application form:', error);
                showMessage('Network Error', 'An error occurred while submitting your application. Please try again later.', 'error');
            } finally {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }


    // --- Request a Quote Modal Logic (on products.html) ---
    const requestQuoteBtn = document.getElementById('requestQuoteBtn');
    const quoteModal = document.getElementById('quoteModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const quoteForm = document.getElementById('quoteForm'); // The form inside the modal

    // Function to show the modal
    function showQuoteModal() {
        if (quoteModal) {
            quoteModal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden'); // Prevent scrolling of the background
        }
    }

    // Function to hide the modal
    function hideQuoteModal() {
        if (quoteModal) {
            quoteModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden'); // Re-enable scrolling
            quoteForm.reset(); // Clear the modal form when closed
        }
    }

    // Event listener to open the modal
    if (requestQuoteBtn) {
        requestQuoteBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior (scrolling or navigating)
            showQuoteModal();
        });
    }

    // Event listener to close the modal using the 'x' button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            hideQuoteModal();
        });
    }

    // Event listener to close the modal when clicking outside of it (on the overlay)
    if (quoteModal) {
        quoteModal.addEventListener('click', (event) => {
            if (event.target === quoteModal) { // Check if the click was directly on the overlay
                hideQuoteModal();
            }
        });
    }

    // --- Request a Quote Form Submission Handling (inside the modal) ---
    if (quoteForm) { // Only run this block if the quote form exists on the page
        quoteForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(quoteForm);

            // Basic client-side validation for required fields
            const requiredFields = ['name', 'phone', 'email', 'city', 'pincode', 'state_ut', 'customer_type', 'customer_segment'];
            let allFieldsFilled = true;
            for (const fieldName of requiredFields) {
                if (!formData.get(fieldName)) {
                    allFieldsFilled = false;
                    break;
                }
            }
            if (!allFieldsFilled) {
                showMessage('Validation Error', 'Please fill in all required fields.', 'error');
                return;
            }

            // Captcha validation (assuming it's a simple sum like 5 + 3)
            const correctCaptchaAnswerElement = document.getElementById('correct_captcha_answer');
            if (correctCaptchaAnswerElement) { // Check if captcha element exists
                const captchaAnswer = parseInt(formData.get('captcha_answer'));
                const correctCaptchaAnswer = parseInt(correctCaptchaAnswerElement.value); // Get correct answer from hidden input
                if (isNaN(captchaAnswer) || captchaAnswer !== correctCaptchaAnswer) {
                    showMessage('Validation Error', 'Incorrect captcha answer. Please try again.', 'error');
                    return;
                }
            } else {
                console.warn("Captcha element 'correct_captcha_answer' not found for quote form. Proceeding without client-side captcha validation.");
                // You might want to return here if captcha is strictly mandatory.
                // showMessage('Configuration Error', 'Captcha element missing. Cannot submit quote.', 'error');
                // return;
            }


            const submitButton = quoteForm.querySelector('#gform_submit_button_modal');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            try {
                // Send the form data to the Flask backend via POST request
                const response = await fetch('/submit_quote', { // Endpoint for quote requests
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json(); // Assuming backend sends JSON response

                if (response.ok) {
                    showMessage('Success!', 'Your quote request has been sent successfully. We will get back to you shortly!', 'success');
                    hideQuoteModal(); // Hide the modal on successful submission
                } else {
                    showMessage('Submission Failed', `Failed to send quote request: ${result.error || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Error submitting quote form:', error);
                showMessage('Network Error', 'An error occurred while sending your quote request. Please try again later.', 'error');
            } finally {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }

    // --- Login and Registration Form Logic (only on login.html) ---
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const signupRedirectBtn = document.getElementById('signupRedirectBtn');
    const loginRedirectBtn = document.getElementById('loginRedirectBtn');
    const title = document.getElementById('title'); // Assuming this is for the login/register page title

    // Custom Alert Modal Elements (only if they exist on the page)
    const customAlertModal = document.getElementById('customAlertModal');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertCloseBtn = document.getElementById('alertCloseBtn');

    // Define showAlert function conditionally
    let showAlert = (titleText, messageText) => { console.log(`ALERT: ${titleText} - ${messageText}`); }; // Default fallback

    if (customAlertModal && alertTitle && alertMessage && alertCloseBtn) {
        showAlert = (titleText, messageText) => {
            alertTitle.textContent = titleText;
            alertMessage.textContent = messageText;
            customAlertModal.style.display = 'flex'; // Show modal
        };
        alertCloseBtn.addEventListener('click', () => {
            customAlertModal.style.display = 'none'; // Hide modal
        });
    } else {
        console.warn("Custom alert modal elements not fully found on this page. Alert functionality may be limited.");
    }


    // --- UI Toggle Logic (Login/Register page specific) ---
    // Only attach listeners if ALL relevant elements exist for the toggle to function
    if (signupRedirectBtn && loginRedirectBtn && loginForm && registerForm && title) {
        signupRedirectBtn.addEventListener('click', () => {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            title.textContent = 'Register';

            // Adjust button styles for active/inactive state
            signupRedirectBtn.classList.remove('active-btn');
            loginRedirectBtn.classList.add('active-btn');
        });

        loginRedirectBtn.addEventListener('click', () => {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            title.textContent = 'Login';

            // Adjust button styles for active/inactive state
            loginRedirectBtn.classList.remove('active-btn');
            signupRedirectBtn.classList.add('active-btn');
        });

        // --- Form Submission Logic (Login/Register page specific) ---

        // Login Form Submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');

            if (!usernameInput || !passwordInput) {
                showAlert('Input Error', 'Login input fields not found.');
                return;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (username === '' || password === '') {
                showAlert('Input Error', 'Please enter both username and password.');
                return;
            }

            try {
                const response = await fetch('/login', { // Flask login endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) { // Check if HTTP status is 2xx
                    showAlert('Success', 'Login successful!');
                    // Give a small delay before redirecting to allow user to see the alert
                    setTimeout(() => {
                        window.location.href = '/dashboard'; // Redirect to dashboard
                    }, 1000);
                } else {
                    showAlert('Login Failed', data.message || 'An error occurred during login.');
                }
            } catch (error) {
                console.error('Error during login:', error);
                showAlert('Network Error', 'Could not connect to the server. Please try again.');
            }
        });

        // Registration Form Submission
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const regUsernameInput = document.getElementById('regUsername');
            const regEmailInput = document.getElementById('regEmail');
            const regPasswordInput = document.getElementById('regPassword');
            const regConfirmPasswordInput = document.getElementById('regConfirmPassword');

            if (!regUsernameInput || !regEmailInput || !regPasswordInput || !regConfirmPasswordInput) {
                showAlert('Input Error', 'Registration input fields not found.');
                return;
            }

            const regUsername = regUsernameInput.value.trim();
            const regEmail = regEmailInput.value.trim();
            const regPassword = regPasswordInput.value.trim();
            const regConfirmPassword = regConfirmPasswordInput.value.trim();

            if (regUsername === '' || regEmail === '' || regPassword === '' || regConfirmPassword === '') {
                showAlert('Input Error', 'All registration fields are required.');
                return;
            }

            if (regPassword !== regConfirmPassword) {
                showAlert('Input Error', 'Passwords do not match.');
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(regEmail)) {
                showAlert('Input Error', 'Please enter a valid email address.');
                return;
            }

            if (regPassword.length < 6) {
                showAlert('Input Error', 'Password must be at least 6 characters long.');
                return;
            }

            try {
                const response = await fetch('/register', { // Flask register endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: regUsername,
                        email: regEmail,
                        password: regPassword
                    })
                });

                const data = await response.json();

                if (response.ok) { // Check if HTTP status is 2xx
                    showAlert('Success', 'Registration successful! You can now log in.');
                    // Give a small delay before switching forms to allow user to see the alert
                    setTimeout(() => {
                        loginRedirectBtn.click(); // Switch to login form
                    }, 1000);
                } else {
                    showAlert('Registration Failed', data.message || 'An error occurred during registration.');
                }
            } catch (error) {
                console.error('Error during registration:', error);
                showAlert('Network Error', 'Could not connect to the server. Please try again.');
            }
        });
    } else {
        console.warn("Login/Register UI elements not fully found on this page. Login/Register functionality will not be active.");
    }

}); // End of main DOMContentLoaded