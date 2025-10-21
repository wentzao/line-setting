// state.js - Application state management
// (Future implementation will go here)
console.log('State management module loaded.');

window.setSelectedAccountId = function setSelectedAccountId(accountId) {
    sessionStorage.setItem('selectedAccountId', accountId);
};

window.getSelectedAccountId = function getSelectedAccountId() {
    return sessionStorage.getItem('selectedAccountId');
};

window.setSelectedProjectId = function setSelectedProjectId(projectId) {
    sessionStorage.setItem('selectedProjectId', projectId);
};

window.getSelectedProjectId = function getSelectedProjectId() {
    return sessionStorage.getItem('selectedProjectId');
}; 