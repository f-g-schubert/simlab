import { AuthService } from './auth-service.js';

if (!AuthService.isLoggedIn()) {
    window.location.href = "/login.html";
}