function getCsrfToken() {
    var name = 'csrftoken';
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var userPortfolio = JSON.parse(localStorage.getItem('userPortfolio')) || {};

function updatePortfolioInLocalStorage() {
    localStorage.setItem('userPortfolio', JSON.stringify(userPortfolio));
}

function updateBackendPortfolio(cryptoName, cryptoAmount) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/update_portfolio/", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("X-CSRFToken", getCsrfToken());

    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log("Response from server:", this.responseText);
        }
    };

    var postData = "crypto_name=" + encodeURIComponent(cryptoName) + "&amount=" + encodeURIComponent(cryptoAmount);
    xhr.send(postData);
}

document.addEventListener('DOMContentLoaded', function() {
    
    var portfolioContainer = document.getElementById('portfolioContainer');

    Object.keys(userPortfolio).forEach(function(cryptoName) {
        var cryptoData = userPortfolio[cryptoName];

        // Create a new div element for the portfolio item
        var newEntry = document.createElement('div');
        newEntry.classList.add('portfolio-item');

        // Create and append the cryptocurrency name span
        var cryptoNameSpan = document.createElement('span');
        cryptoNameSpan.classList.add('crypto-name');
        cryptoNameSpan.textContent = cryptoName;
        newEntry.appendChild(cryptoNameSpan);

        // Create and append the cryptocurrency amount span
        var cryptoAmountSpan = document.createElement('span');
        cryptoAmountSpan.classList.add('crypto-amount');
        cryptoAmountSpan.textContent = cryptoData.amount;
        newEntry.appendChild(cryptoAmountSpan);

        // Create and append the slider for sensitivity
        var slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'slider';
        slider.min = '0';
        slider.max = '100';
        slider.value = ((cryptoData.sensitivity - 0.1) / 1.9) * 100; // Convert sensitivity back to slider value
        slider.setAttribute('data-crypto-name', cryptoName);
        slider.addEventListener('input', debounce(function() {
            updateSliderTrack(this);
            var sensitivityValue = convertSliderValue(this.value);
            sendSensitivityData(cryptoName, sensitivityValue);
        }, 1000));
        newEntry.appendChild(slider);
        updateSliderTrack(slider); // Update the slider's appearance

        // Create and append the remove button
        var removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.innerHTML = '<i class="fas fa-trash"></i>';
        removeButton.addEventListener('click', function() {
            sendDeleteCryptoData(cryptoName);
            newEntry.remove();
        });
        newEntry.appendChild(removeButton);

        // Append the new entry to the portfolio container
        portfolioContainer.appendChild(newEntry);
    });
});

function updateSliderTrack(sliderElement) {
    var value = (sliderElement.value - sliderElement.min) / (sliderElement.max - sliderElement.min) * 100;
    sliderElement.style.background = `linear-gradient(to right, #007bff ${value}%, #d3d3d3 ${value}%)`;
}

document.querySelector('.add-button').addEventListener('click', function() {
    var cryptoDropdown = document.getElementById('cryptoDropdown');
    var selectedCrypto = cryptoDropdown.options[cryptoDropdown.selectedIndex].text;
    var cryptoAmount = document.getElementById('cryptoAmount').value;

    if (selectedCrypto && cryptoAmount) {
        // ... existing code to create and append the new entry ...
        var newEntry = document.createElement('div');
        newEntry.classList.add('portfolio-item');

        var cryptoNameSpan = document.createElement('span');
        cryptoNameSpan.classList.add('crypto-name');
        cryptoNameSpan.textContent = selectedCrypto;
        newEntry.appendChild(cryptoNameSpan);

        var cryptoAmountSpan = document.createElement('span');
        cryptoAmountSpan.classList.add('crypto-amount');
        cryptoAmountSpan.textContent = cryptoAmount;
        newEntry.appendChild(cryptoAmountSpan);

        var slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'slider';
        slider.setAttribute('data-crypto-name', selectedCrypto);
        slider.min = '0';
        slider.max = '100';
        slider.value = '50';

        

        slider.addEventListener('input', debounce(function() {
            updateSliderTrack(this);
            var sensitivityValue = convertSliderValue(this.value);
            var cryptoName = this.getAttribute('data-crypto-name');
        
            console.log("Updating sensitivity for:", cryptoName); // Log for debugging
            sendSensitivityData(cryptoName, sensitivityValue);
        }, 1000));
        

        updateSliderTrack(slider);
        newEntry.appendChild(slider);

        var removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.innerHTML = '<i class="fas fa-trash"></i>';
        removeButton.addEventListener('click', function() {
            var cryptoName = this.parentNode.querySelector('.crypto-name').textContent;
            sendDeleteCryptoData(cryptoName);
            this.parentNode.remove();
        });
        newEntry.appendChild(removeButton);

        document.getElementById('portfolioContainer').appendChild(newEntry);
        document.getElementById('cryptoAmount').value = '';

        userPortfolio[selectedCrypto] = { amount: cryptoAmount, sensitivity: 1.0 }; // Default sensitivity
        updatePortfolioInLocalStorage();
        updateBackendPortfolio(selectedCrypto, cryptoAmount); // Pass the selected crypto and amount to the update function
    } else {
        console.error("Cryptocurrency name or amount is undefined.");
    }    
});

function sendSensitivityData(cryptoName, sensitivity) {
    if (cryptoName && cryptoName !== 'undefined' && sensitivity && !isNaN(sensitivity)) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/update_sensitivity/", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("X-CSRFToken", getCsrfToken());

        xhr.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                console.log("Sensitivity updated:", this.responseText);
                if (userPortfolio[cryptoName]) {
                    userPortfolio[cryptoName].sensitivity = sensitivity;
                    updatePortfolioInLocalStorage();
                    updateBackendPortfolio();
                }
            }
        };

        xhr.send("crypto_name=" + encodeURIComponent(cryptoName) + "&sensitivity=" + encodeURIComponent(sensitivity));
    } else {
        console.error("Invalid cryptocurrency name for sensitivity update.");
    }
}


function sendDeleteCryptoData(cryptoName) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/delete_crypto/", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("X-CSRFToken", getCsrfToken());

    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log("Crypto deleted:", this.responseText);
            delete userPortfolio[cryptoName];
            updatePortfolioInLocalStorage();
            updateBackendPortfolio();
        }
    };

    xhr.send("crypto_name=" + encodeURIComponent(cryptoName));
}

function debounce(func, delay) {
    var timeoutID = null;
    return function() {
        clearTimeout(timeoutID);
        var args = arguments;
        var context = this;
        timeoutID = setTimeout(function() {
            func.apply(context, args);
        }, delay);
    };
}

function convertSliderValue(value) {
    return (value / 100) * 1.9 + 0.1;
}


slider.addEventListener('input', debounce(function() {
    updateSliderTrack(this);
    var sensitivityValue = convertSliderValue(this.value);
    var cryptoName = this.getAttribute('data-crypto-name');
    sendSensitivityData(cryptoName, sensitivityValue);
}, 1000));

function sendDeleteCryptoData(cryptoName) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/delete_crypto/", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("X-CSRFToken", getCsrfToken());

    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log("Crypto deleted:", this.responseText);
            
            // Remove the crypto from userPortfolio in memory
            delete userPortfolio[cryptoName];
            
            // Update userPortfolio in local storage
            updatePortfolioInLocalStorage();
        }
    };

    xhr.send("crypto_name=" + encodeURIComponent(cryptoName));
}



function debounce(func, delay) {
    var timeoutID = null;
    return function() {
        clearTimeout(timeoutID);
        var args = arguments;
        var context = this;
        timeoutID = setTimeout(function() {
            func.apply(context, args);
        }, delay);
    };
}

