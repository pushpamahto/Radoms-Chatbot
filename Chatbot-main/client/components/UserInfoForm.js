import { isValidEmail, isValidPhone } from '../utils/validations.js';
import { baseUrl } from '../config/constants.js';

export class UserInfoForm {
    constructor() {
        this.userInfoPopup = document.querySelector(".user-info-popup");
        this.userInfoForm = document.querySelector("#user-info-form");
        this.userNameInput = document.querySelector("#user-name");
        this.userEmailInput = document.querySelector("#user-email");
        this.emailError = document.querySelector("#email-error");
        this.userPhoneInput = document.querySelector("#user-phone");
        this.phoneError = document.querySelector("#phone-error");
        
        this.userInfo = null;
    }

    setupEventListeners() {
        // Validate email on input
        this.userEmailInput.addEventListener("input", () => this.validateEmail());
        
        // Validate phone on input
        this.userPhoneInput.addEventListener("input", () => this.validatePhone());
        
        // Validate form on submission
        this.userInfoForm.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }

    validateEmail() {
        const email = this.userEmailInput.value.trim();
        
        if (email && !isValidEmail(email)) {
            this.userEmailInput.classList.add("error");
            this.emailError.style.display = "block";
        } else {
            this.userEmailInput.classList.remove("error");
            this.emailError.style.display = "none";
        }
    }

    validatePhone() {
        const phone = this.userPhoneInput.value.trim();
        const countrySelector = document.getElementById('country-selector');
        const selectedCountryCode = countrySelector.getAttribute('data-selected-code');
        
        if (phone && !isValidPhone(phone)) {
            this.userPhoneInput.classList.add("error");
            this.phoneError.style.display = "block";
        } else {
            this.userPhoneInput.classList.remove("error");
            this.phoneError.style.display = "none";
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const name = this.userNameInput.value.trim();
        const email = this.userEmailInput.value.trim();
        const phone = this.userPhoneInput.value.trim();
        const countrySelector = document.getElementById('country-selector');
        const selectedCountryCode = countrySelector.getAttribute('data-selected-code');
        const selectedCountry = this.getCountryByCode(selectedCountryCode);
        
        // Validate email
        if (!isValidEmail(email)) {
            this.userEmailInput.classList.add("error");
            this.emailError.style.display = "block";
            this.userEmailInput.focus();
            return;
        }
        
        // Validate phone
        if (!isValidPhone(phone)) {
            this.userPhoneInput.classList.add("error");
            this.phoneError.style.display = "block";
            this.userPhoneInput.focus();
            return;
        }
        
        if (!name || !email || !phone) return;
        
        // Format the complete phone number with country code
        const completePhoneNumber = selectedCountry.dialCode + phone;
        
        this.userInfo = {
            name,
            email,
            phone: completePhoneNumber,
            countryCode: selectedCountry.dialCode
        };
        
        // Send user data to backend
        this.saveUserData(this.userInfo);
        
        // Reset form
        this.userNameInput.value = "";
        this.userEmailInput.value = "";
        this.userPhoneInput.value = "";
        
        // Reset error state
        this.userEmailInput.classList.remove("error");
        this.emailError.style.display = "none";
        this.userPhoneInput.classList.remove("error");
        this.phoneError.style.display = "none";
        
        return this.userInfo;
    }

    getCountryByCode(code) {
        // This would reference the countries array from CountrySelector
        // For simplicity, we'll return a default
        return { dialCode: "+1" };
    }

    async saveUserData(userInfo) {
        try {
            const response = await fetch(`${baseUrl}/save-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userInfo)
            });
            
            const data = await response.json();
            console.log('User data saved:', data);
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }
}