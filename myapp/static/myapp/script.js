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

document.querySelector('.add-button').addEventListener('click', function() {
    var selectedCrypto = document.getElementById('cryptoDropdown').options[document.getElementById('cryptoDropdown').selectedIndex].text;
    var cryptoAmount = document.getElementById('cryptoAmount').value;
    
    // Create a new div element for the portfolio item
    var newEntry = document.createElement('div');
    newEntry.classList.add('portfolio-item');

    // Create and append the cryptocurrency name span
    var cryptoNameSpan = document.createElement('span');
    cryptoNameSpan.classList.add('crypto-name');
    cryptoNameSpan.textContent = selectedCrypto;
    newEntry.appendChild(cryptoNameSpan);

    // Create and append the cryptocurrency amount span
    var cryptoAmountSpan = document.createElement('span');
    cryptoAmountSpan.classList.add('crypto-amount');
    cryptoAmountSpan.textContent = cryptoAmount;
    newEntry.appendChild(cryptoAmountSpan);

    // Create the slider
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = '0';
    slider.max = '100';
    slider.value = '50'; // Set to a default value or based on amount

    // Function to update the slider's appearance
    function updateSliderTrack(sliderElement) {
        var value = (sliderElement.value - sliderElement.min) / (sliderElement.max - sliderElement.min) * 100;
        sliderElement.style.background = `linear-gradient(to right, #007bff ${value}%, #d3d3d3 ${value}%)`;
    }

    // Attach an 'input' event listener to the slider
    slider.addEventListener('input', function() {
        updateSliderTrack(this);
    });

    // Initialize the slider appearance and append it
    updateSliderTrack(slider);
    newEntry.appendChild(slider);

    // Create the remove button
    var removeButton = document.createElement('button');
    removeButton.className = 'remove-button';
    removeButton.innerHTML = '<i class="fas fa-trash"></i>';
    // Event listener for remove button
    removeButton.addEventListener('click', function() {
        this.parentNode.remove();
    });
    newEntry.appendChild(removeButton);

    // Append the new entry to the portfolio container and clear the amount field
    document.getElementById('portfolioContainer').appendChild(newEntry);
    document.getElementById('cryptoAmount').value = '';

    document.getElementById('portfolioContainer').appendChild(newEntry);
    document.getElementById('cryptoAmount').value = '';

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/update_portfolio/", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("X-CSRFToken", getCsrfToken());

    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            // Response handling logic here
            console.log("Response from server:", this.responseText);
        }
    };

    xhr.send("crypto_name=" + encodeURIComponent(selectedCrypto) + "&amount=" + encodeURIComponent(cryptoAmount));
});

// Event listener for mute button
document.getElementById('muteButton').addEventListener('click', function() {
    // Mute logic
    // ...
});

