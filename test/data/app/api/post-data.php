<?php
session_start();

header('Content-Type: application/json');

if (isset($_SESSION['post_data'])) {
    echo json_encode($_SESSION['post_data']);
    // Clear the POST data after serving
    unset($_SESSION['post_data']);
} else {
    echo json_encode([]);
}
?>