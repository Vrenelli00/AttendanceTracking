const scannedQRs = new Map();
let lastScanTime = 0;
const scanDelay = 2000; // 2 seconds delay

function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function getQrboxSize() {
    return 150; // Adjust this value to change the QR box size
}

async function onScanSuccess(decodedText) {
    const currentTime = new Date().getTime();

    // Check if the scan delay has passed
    if (currentTime - lastScanTime < scanDelay) {
        return; // Ignore the scan if the delay hasn't passed
    }

    lastScanTime = currentTime; // Update the last scan time
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();

    if (!scannedQRs.has(decodedText)) {
        scannedQRs.set(decodedText, { timeIn: time, date: date, row: null });

        const tableBody = document.getElementById("result-table").getElementsByTagName("tbody")[0];
        const newRow = tableBody.insertRow();

        const newCellQRData = newRow.insertCell(0);
        const newCellTimeIn = newRow.insertCell(1);
        const newCellTimeOut = newRow.insertCell(2);
        const newCellDate = newRow.insertCell(3);
        const newCellStatus = newRow.insertCell(4);
        const newCellAction = newRow.insertCell(5);

        newCellQRData.textContent = decodedText;
        newCellTimeIn.textContent = time;
        newCellTimeOut.textContent = '';
        newCellDate.textContent = date;
        newCellStatus.textContent = "PRESENT";

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "export-button";
        deleteButton.onclick = function() {
            deleteRow(decodedText, newRow);
        };
        newCellAction.appendChild(deleteButton);

        scannedQRs.get(decodedText).row = newRow;

        // Send attendance data to server
        try {
            const response = await fetch('api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentName: decodedText,
                    timeIn: time,
                    date: date,
                    status: 'Present'
                })
            });
            const result = await response.json();
            if (!result.success) {
                console.error('Failed to save attendance:', result.message);
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
        }
    } else {
        const qrData = scannedQRs.get(decodedText);

        if (qrData.row) {
            qrData.row.cells[2].textContent = time;
            
            // Update time-out in database
            try {
                const response = await fetch('api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        studentName: decodedText,
                        timeIn: qrData.timeIn,
                        timeOut: time,
                        date: date,
                        status: 'Present'
                    })
                });
                const result = await response.json();
                if (!result.success) {
                    console.error('Failed to update time-out:', result.message);
                }
            } catch (error) {
                console.error('Error updating time-out:', error);
            }
        }

        scannedQRs.delete(decodedText);
    }

    saveDataToLocalStorage();
}

function initializeScanner() {
    const htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { 
            fps: 10, 
            qrbox: getQrboxSize(),
            rememberLastUsedCamera: true,
            facingMode: { exact: "environment" }
        }
    );
    htmlscanner.render(onScanSuccess);
}

function saveDataToLocalStorage() {
    const tableBody = document.getElementById("result-table").getElementsByTagName("tbody")[0];
    const rows = tableBody.getElementsByTagName("tr");

    const data = [];
    for (let row of rows) {
        const cells = row.getElementsByTagName("td");
        data.push({
            qrData: cells[0].textContent,
            timeIn: cells[1].textContent,
            timeOut: cells[2].textContent,
            date: cells[3].textContent,
            status: cells[4].textContent
        });
    }

    localStorage.setItem("attendanceData", JSON.stringify(data));
}

function loadDataFromLocalStorage() {
    const savedData = JSON.parse(localStorage.getItem("attendanceData") || "[]");
    const tableBody = document.getElementById("result-table").getElementsByTagName("tbody")[0];

    savedData.forEach(data => {
        const newRow = tableBody.insertRow();
        newRow.insertCell(0).textContent = data.qrData;
        newRow.insertCell(1).textContent = data.timeIn;
        newRow.insertCell(2).textContent = data.timeOut;
        newRow.insertCell(3).textContent = data.date;
        newRow.insertCell(4).textContent = data.status;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "export-button";
        deleteButton.onclick = function() {
            deleteRow(data.qrData, newRow);
        };
        newRow.insertCell(5).appendChild(deleteButton);
    });
}

function deleteRow(qrData, row) {
    const tableBody = document.getElementById("result-table").getElementsByTagName("tbody")[0];
    tableBody.deleteRow(row.rowIndex - 1); // Adjust for header row
    scannedQRs.delete(qrData); // Remove from the scanned QR map
    saveDataToLocalStorage(); // Update local storage
}

function openExportSection() {
    document.getElementById("export-section").style.display = "block";
}

function validateAdmin() {
    const password = document.getElementById("admin-password").value;

    if (password === "admin123") { // Replace with your desired password
        const exportSection = document.getElementById("export-section");
        const tableBody = document.getElementById("result-table").getElementsByTagName("tbody")[0];
        const exportTableBody = document.getElementById("export-table").getElementsByTagName("tbody")[0];

        exportTableBody.innerHTML = ""; // Clear existing rows

        Array.from(tableBody.rows).forEach(row => {
            const newRow = exportTableBody.insertRow();
            Array.from(row.cells).forEach(cell => {
                const newCell = newRow.insertCell();
                newCell.textContent = cell.textContent;
            });
        });

        exportSection.style.display = "block";
    } else {
        alert("Incorrect password");
    }
}

function sortTableByLastName() {
    const tableBody = document.getElementById("export-table").getElementsByTagName("tbody")[0];
    const rows = Array.from(tableBody.rows);

    rows.sort((rowA, rowB) => {
        const lastNameA = rowA.cells[0].textContent.trim().split(" ").pop();
        const lastNameB = rowB.cells[0].textContent.trim().split(" ").pop();
        return lastNameA.localeCompare(lastNameB);
    });

    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    rows.forEach(row => {
        tableBody.appendChild(row);
    });
}

function downloadExcel() {
    const tableBody = document.getElementById("export-table").getElementsByTagName("tbody")[0];
    const rows = Array.from(tableBody.rows);

    const data = [];
    rows.forEach(row => {
        const rowData = Array.from(row.cells).map(cell => cell.textContent);
        data.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Data");

    XLSX.writeFile(wb, "attendance_data.xlsx");

    clearAttendanceData();
}

function clearAttendanceData() {
    const resultTableBody = document.getElementById("result-table").getElementsByTagName("tbody")[0];
    while (resultTableBody.firstChild) {
        resultTableBody.removeChild(resultTableBody.firstChild);
    }

    const exportTableBody = document.getElementById("export-table").getElementsByTagName("tbody")[0];
    while (exportTableBody.firstChild) {
        exportTableBody.removeChild(exportTableBody.firstChild);
    }

    localStorage.removeItem("attendanceData");
}

// Initialize the application
domReady(() => {
    initializeScanner();
    loadDataFromLocalStorage();
});