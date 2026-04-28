import { AuthService } from './auth-service.js';

if (!AuthService.isLoggedIn()) {
    window.location.href = "/login.html";
}

async function createProject(project) {
    const { error } = await supabase
        .from('projects')
        .insert([project]);

    if (error) console.error(error);
}