<?php
// db.php - simple helper for future DB connection
// Currently uses a JSON file as a user store for demo purposes.

function get_users_file() {
    return __DIR__ . '/users.json';
}

function load_users() {
    $file = get_users_file();
    if (!file_exists($file)) return [];
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function save_users($users) {
    $file = get_users_file();
    file_put_contents($file, json_encode(array_values($users), JSON_PRETTY_PRINT));
}

function find_user_by_email($email) {
    $users = load_users();
    foreach ($users as $u) {
        if (isset($u['email']) && strtolower($u['email']) === strtolower($email)) return $u;
    }
    return null;
}

function verify_password($plain, $hash) {
    return password_verify($plain, $hash);
}

function add_user($email, $password, $role = 'user', $extra = []) {
    $users = load_users();
    $user = array_merge([
        'id' => uniqid('', true),
        'email' => $email,
        'password' => password_hash($password, PASSWORD_DEFAULT),
        'role' => $role,
        'created_at' => date('c'),
    ], is_array($extra) ? $extra : []);
    $users[] = $user;
    save_users($users);
    return $user;
}

?>