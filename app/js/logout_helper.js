async function doServerLogout() {
  const t = localStorage.getItem('auth_token') || '';
  try {
    await fetch('https://n8n.senado-nusp.cloud/webhook/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${t}` }
    });
  } catch (e) {
    // mesmo que falhe, seguimos limpando o cliente
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    location.href = '/index.html';
  }
}
window.doServerLogout = doServerLogout; // se precisar chamar de outros arquivos
