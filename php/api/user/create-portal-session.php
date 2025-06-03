<?php
require_once 'vendor/autoload.php';

$stripe = new \Stripe\StripeClient('sk_test_your_secret_key');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $session = $stripe->billingPortal->sessions->create([
            'customer' => $input['customer_id'],
            'return_url' => 'https://habituszone.com/account',
        ]);
        
        echo json_encode(['url' => $session->url]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>