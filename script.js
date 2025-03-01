const apiKey = "5f0b5c80472d0e02958f029a"; 
const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

let exchangeRates = {};  
let currencyChart; 

// Fetch exchange rates
async function fetchExchangeRates(forceUpdate = false) {
    const lastUpdatedTime = localStorage.getItem("lastUpdatedTime");
    const currentTime = Date.now();
    const updateInterval = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Fetch new data if forced, or if 5 minutes have passed since last update
    if (forceUpdate || !lastUpdatedTime || currentTime - lastUpdatedTime > updateInterval) {
        try {
            let response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            let data = await response.json();

            if (data.result === "error") {
                console.error("API Error:", data);
                alert("Error fetching exchange rates: " + data["error-type"]);
                return;
            }

            // Store exchange rates in  local storage
            exchangeRates = data.conversion_rates;
            localStorage.setItem("exchangeRates", JSON.stringify(exchangeRates));
            localStorage.setItem("lastUpdatedTime", currentTime);
            updateLastUpdatedDisplay();

            console.log("Exchange rates updated:", exchangeRates);

            populateDropdowns(Object.keys(exchangeRates)); 

        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Failed to fetch exchange rates. Please check your API key or try again later.");
        }
    } else {
        exchangeRates = JSON.parse(localStorage.getItem("exchangeRates"));
        updateLastUpdatedDisplay();
        console.log("Using cached exchange rates:", exchangeRates);

        populateDropdowns(Object.keys(exchangeRates)); 
    }
}

//  currency dropdowns dynamically
function populateDropdowns(currencyList) {
    let fromDropdown = document.getElementById("fromCurrency");
    let toDropdown = document.getElementById("toCurrencies");

    // Clear previous options
    fromDropdown.innerHTML = ""; 
    toDropdown.innerHTML = ""; 

    currencyList.forEach(currency => {
        let fromOption = document.createElement("option");
        fromOption.value = currency;
        fromOption.textContent = currency;
        fromDropdown.appendChild(fromOption);

        let toOption = document.createElement("option");
        toOption.value = currency;
        toOption.textContent = currency;
        toDropdown.appendChild(toOption);
    });

    fromDropdown.value = "USD"; // Default to USD
}

// Display last updated time on UI
function updateLastUpdatedDisplay() {
    let timeNow = new Date();
    document.getElementById("lastUpdatedTime").textContent = timeNow.toLocaleTimeString();
}

// Refresh data manually when the user requests it
function manualRefresh() {
    console.log("Manual refresh triggered!");
    fetchExchangeRates(true);
    updateCurrencyChart(); 
}

// Fetch exchange rates when the page loads
fetchExchangeRates();
setInterval(fetchExchangeRates, 300000); // Auto-refresh every 5 minutes

// Convert currency based on selected inputs
function convertCurrency() {
    let amount = document.getElementById("amount").value;
    let fromCurrency = document.getElementById("fromCurrency").value;
    let selectedCurrencies = Array.from(document.getElementById("toCurrencies").selectedOptions).map(option => option.value);
    let resultContainer = document.getElementById("conversionResults");

    resultContainer.innerHTML = ""; // Clear previous results

    if (amount === "" || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (selectedCurrencies.length === 0) {
        alert("Please select at least one currency.");
        return;
    }

    // Perform currency conversion
    selectedCurrencies.forEach(currency => {
        let convertedValue = (amount * exchangeRates[currency] / exchangeRates[fromCurrency]).toFixed(2);
        
        let resultItem = document.createElement("li");
        resultItem.textContent = `${amount} ${fromCurrency} = ${convertedValue} ${currency}`;
        resultContainer.appendChild(resultItem);
    });

    updateCurrencyChart();
}

// Update exchange rate chart dynamically
function updateCurrencyChart() {
    let fromCurrency = document.getElementById("fromCurrency").value;
    let selectedCurrencies = Array.from(document.getElementById("toCurrencies").selectedOptions).map(option => option.value);

    if (selectedCurrencies.length === 0) {
        alert("Please select at least one currency for the graph.");
        return;
    }

    let labels = selectedCurrencies; // Currencies on X-axis
    let rates = selectedCurrencies.map(currency => exchangeRates[currency]); // Exchange rates on Y-axis

    let chartCanvas = document.getElementById("currencyChart").getContext("2d");

    // Remove previous chart instance before creating a new one
    if (currencyChart) {
        currencyChart.destroy();
    }

    // Generate currency exchange rate graph
    currencyChart = new Chart(chartCanvas, {
        type: "line", // Line chart format
        data: {
            labels: labels,
            datasets: [{
                label: `Exchange Rate (1 ${fromCurrency})`,
                data: rates,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.2)",
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false // Prevents unnecessary zero scaling
                }
            }
        }
    });
}

// Update chart when currencies change
document.getElementById("fromCurrency").addEventListener("change", updateCurrencyChart);
document.getElementById("toCurrencies").addEventListener("change", updateCurrencyChart);
