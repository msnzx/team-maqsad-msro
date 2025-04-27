let map;
let directionsService;
let directionsRenderer;
let currentUnit = "miles"; // Default

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 8,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true }); // Hide default markers
    directionsRenderer.setMap(map);

    // Initialize Autocomplete
    initAutocomplete();
}

function initAutocomplete() {
    // Origin Input with Autocomplete
    const originInput = document.getElementById("origin");
    new google.maps.places.Autocomplete(originInput);

    // Destination Input with Autocomplete
    const destinationInput = document.getElementById("destination");
    new google.maps.places.Autocomplete(destinationInput);

    // Stop Inputs with Autocomplete
    const stopInputs = document.querySelectorAll(".stop");
    stopInputs.forEach((input) => {
        new google.maps.places.Autocomplete(input);
    });

    // Add New Stop Input with Autocomplete when button is clicked
    document.getElementById("add-stop-btn").addEventListener("click", () => {
        const newStopInput = document.createElement("input");
        newStopInput.type = "text";
        newStopInput.classList.add("stop");
        newStopInput.placeholder = "Enter a stop";
        document.getElementById("stops-container").appendChild(newStopInput);

        // Apply Autocomplete to the new stop input
        new google.maps.places.Autocomplete(newStopInput);
    });
}

function calculateAndDisplayRoute() {
    const origin = document.getElementById("origin").value;
    const destination = document.getElementById("destination").value;
    const stops = document.querySelectorAll(".stop");

    let waypoints = [];
    let stopList = [`${origin}`]; // Start with the origin

    stops.forEach((stopInput) => {
        const stop = stopInput.value;
        if (stop) {
            waypoints.push({
                location: stop,
                stopover: true,
            });
            stopList.push(stop); // Add stop to the ordered list
        }
    });

    stopList.push(destination); // Add destination to the list

    // Update the ordered stops list in the UI
    updateOrderedStopsList(stopList);

    directionsService.route(
        {
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
                placeNumberedMarkers(response);
                displayTotalDistanceAndTime(response);
            } else {
                alert("Directions request failed due to " + status);
            }
        }
    );
}

// Function to update the ordered stops list with numbers
function updateOrderedStopsList(stopList) {
    const orderedStopsList = document.getElementById("ordered-stops-list");
    orderedStopsList.innerHTML = ""; // Clear previous list

    stopList.forEach((stop, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${stop}`; // Add numbering before the stop name
        orderedStopsList.appendChild(li);
    });
}

// Function to display total distance and time with bold and underlined text
// function displayTotalDistanceAndTime(response) {
//     const totalDistance = response.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0);
//     const totalDuration = response.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0);

//     const distanceText = (totalDistance / 1000).toFixed(2) + " km"; // Convert meters to kilometers
//     const durationText = Math.floor(totalDuration / 60) + " min"; // Convert seconds to minutes

//     const distanceElement = document.getElementById("total-distance");
//     const timeElement = document.getElementById("total-time");

//     // Bold and underline the distance and time for visibility
//     distanceElement.innerHTML = `<strong><u>${distanceText}</u></strong>`;
//     timeElement.innerHTML = `<strong><u>${durationText}</u></strong>`;
// }
function displayTotalDistanceAndTime(response) {
    const totalDistance = response.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0);
    const totalDuration = response.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0);

    const distanceText = (totalDistance / 1000).toFixed(2) + " km"; // Convert meters to kilometers
    const durationText = Math.floor(totalDuration / 60) + " min"; // Convert seconds to minutes

    const distanceElement = document.getElementById("total-distance");
    const timeElement = document.getElementById("total-time");

    // Update the total distance and time in the #total-info section
    distanceElement.textContent = `Total Distance: ${distanceText}`;
    timeElement.textContent = `Total Time: ${durationText}`;
}

// Function to update the ordered stops list
function updateOrderedStopsList(stopList) {
    const orderedStopsList = document.getElementById("ordered-stops-list");
    orderedStopsList.innerHTML = ""; // Clear previous list

    stopList.forEach((stop) => {
        const li= document.createElement("li");
        li.textContent = stop;
        orderedStopsList.appendChild(li);
    });
}

// Place custom numbered markers
function placeNumberedMarkers(response) {
    const route = response.routes[0];
    const legs = route.legs;

    // Clear previous markers
    if (window.markersArray) {
        window.markersArray.forEach(marker => marker.setMap(null));
    }
    window.markersArray = [];

    let stepNumber = 1;

    legs.forEach((leg) => {
        // Origin Marker
        const markerOrigin = new google.maps.Marker({
            position: leg.start_location,
            label: stepNumber.toString(),
            map: map,
        });
        window.markersArray.push(markerOrigin);
        stepNumber++;
    });

    // Destination Marker
    const markerDestination = new google.maps.Marker({
        position: legs[legs.length - 1].end_location,
        label: stepNumber.toString(),
        map: map,
    });
    window.markersArray.push(markerDestination);
}

// Calculate and display total distance and time
function displayTotalDistanceAndTime(response) {
    const route = response.routes[0];
    let totalDistance = 0;
    let totalDuration = 0;

    const legs = route.legs;
    for (let i = 0; i < legs.length; i++) {
        totalDistance += legs[i].distance.value; // in meters
        totalDuration += legs[i].duration.value; // in seconds
    }

    updateDistanceTimeText(totalDistance, totalDuration);
    // Save the distance and time into a hidden div for printing
    let routeSummary = document.getElementById("route-summary");
    if (!routeSummary) {
        routeSummary = document.createElement("div");
        routeSummary.id = "route-summary";
        routeSummary.style.display = "none"; // Hide it
        document.body.appendChild(routeSummary);
    }

    let distanceText = "";
    if (currentUnit === "miles") {
        distanceText = (totalDistance / 1609.34).toFixed(2) + " miles";
    } else {
        distanceText = (totalDistance / 1000).toFixed(2) + " km";
    }

    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    routeSummary.dataset.distance = distanceText;
    routeSummary.dataset.duration = `${hours} hr ${minutes} min`;

}

function updateDistanceTimeText(totalDistanceMeters, totalDurationSeconds) {
    let distanceText = "";
    if (currentUnit === "miles") {
        distanceText = (totalDistanceMeters / 1609.34).toFixed(2) + " miles";
    } else {
        distanceText = (totalDistanceMeters / 1000).toFixed(2) + " km";
    }

    const hours = Math.floor(totalDurationSeconds / 3600);
    const minutes = Math.floor((totalDurationSeconds % 3600) / 60);

    document.getElementById("distance-time").innerHTML = 
        `Total Distance: ${distanceText}<br>Total Time: ${hours} hr ${minutes} min`;
}

// Toggle miles ↔ km
document.getElementById("toggle-unit-btn").addEventListener("click", () => {
    currentUnit = (currentUnit === "miles") ? "kilometers" : "miles";
    calculateAndDisplayRoute();
});

document.getElementById("print-stops-btn").addEventListener("click", () => {
    const origin = document.getElementById("origin").value;
    const destination = document.getElementById("destination").value;
    const stops = document.querySelectorAll(".stop");

    let stopList = [`${origin}`];

    stops.forEach((stopInput) => {
        const stop = stopInput.value;
        if (stop) {
            stopList.push(stop);
        }
    });

    stopList.push(destination);

    // Get total distance and time
    const routeSummary = document.getElementById("route-summary");
    const totalDistance = routeSummary ? routeSummary.dataset.distance : "N/A";
    const totalDuration = routeSummary ? routeSummary.dataset.duration : "N/A";

    // Open new window
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Route Details</title></head><body>');
    printWindow.document.write('<h1>Route Details</h1>');

    // Route Summary
    printWindow.document.write(`<p><strong>Total Distance:</strong> ${totalDistance}</p>`);
    printWindow.document.write(`<p><strong>Total Time:</strong> ${totalDuration}</p>`);

    // Stops List
    printWindow.document.write('<h2>Stops</h2>');
    printWindow.document.write('<ol>'); // Ordered list
    stopList.forEach((stop) => {
        printWindow.document.write(`<li>${stop}</li>`);
    });
    printWindow.document.write('</ol>');

    printWindow.document.write('</body></html>');

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
});

// Add stop button
// document.getElementById("add-stop-btn").addEventListener("click", () => {
//     const stopsContainer = document.getElementById("stops-container");
//     const newStopInput = document.createElement("input");
//     newStopInput.type = "text";
//     newStopInput.classList.add("stop");
//     newStopInput.placeholder = "Enter a stop";
//     stopsContainer.appendChild(newStopInput);

//     // Apply Autocomplete to the new stop input
//     new google.maps.places.Autocomplete(newStopInput);
// });

// Form submit
document.getElementById("route-form").addEventListener("submit", (event) => {
    event.preventDefault();
    calculateAndDisplayRoute();
});

window.onload = initMap;