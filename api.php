<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        if (isset($data['timeOut'])) {
            // Update time-out
            $stmt = $pdo->prepare("UPDATE Attendance SET Time_Out = ? WHERE StudentName = ? AND Date = ? AND Time_In = ?");
            $stmt->execute([
                $data['timeOut'],
                $data['studentName'],
                $data['date'],
                $data['timeIn']
            ]);
        } else {
            // Insert new attendance record
            $stmt = $pdo->prepare("INSERT INTO Attendance (StudentName, Time_In, Date, Status) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['studentName'],
                $data['timeIn'],
                $data['date'],
                $data['status']
            ]);
        }
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['studentName']) && isset($data['timeIn']) && isset($data['date'])) {
        $studentName = $data['studentName'];
        $timeIn = $data['timeIn'];
        $timeOut = $data['timeOut'] ?? null;
        $date = $data['date'];
        $status = $data['status'] ?? 'Present';
        
        // First, check if student exists in Students table
        $stmt = $conn->prepare("SELECT StudentID FROM Students WHERE StudentName = ?");
        $stmt->bind_param("s", $studentName);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            // If student doesn't exist, add them
            $stmt = $conn->prepare("INSERT INTO Students (StudentName) VALUES (?)");
            $stmt->bind_param("s", $studentName);
            $stmt->execute();
            $studentId = $conn->insert_id;
        } else {
            $row = $result->fetch_assoc();
            $studentId = $row['StudentID'];
        }
        
        // Insert attendance record
        $stmt = $conn->prepare("INSERT INTO Attendance (StudentID, StudentName, Time_In, Time_Out, Date, Status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssss", $studentId, $studentName, $timeIn, $timeOut, $date, $status);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Attendance recorded successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error recording attendance']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing required data']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch all attendance records
    $sql = "SELECT * FROM Attendance ORDER BY Date DESC, Time_In DESC";
    $result = $conn->query($sql);
    
    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }
    
    echo json_encode(['success' => true, 'data' => $records]);
}

$conn->close();
?>