// Classe Account com recursos melhorados
class Account {
    constructor(number, holder, initialDeposit = 0) {
        this.number = number;
        this.holder = holder;
        this.balance = 0;
        this.transactions = [];
        this.createdAt = new Date();
        
        if (initialDeposit > 0) {
            this.deposit(initialDeposit);
        }
    }
    
    deposit(amount) {
        if (amount > 0) {
            this.balance += amount;
            this.addTransaction('Depósito', amount);
            return true;
        }
        return false;
    }
    
    withdraw(amount) {
        const fee = 5.0; // Taxa de saque
        const totalAmount = amount + fee;
        
        if (amount > 0 && this.balance >= totalAmount) {
            this.balance -= totalAmount;
            this.addTransaction('Saque', -amount);
            this.addTransaction('Taxa de saque', -fee);
            return true;
        }
        return false;
    }
    
    addTransaction(description, amount) {
        this.transactions.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            description: description,
            amount: amount,
            date: new Date(),
            balance: this.balance
        });
    }

    // Retorna os últimos 4 dígitos do número da conta formatado
    getCardNumber() {
        const accountStr = this.number.toString().padStart(16, '0');
        return `•••• •••• •••• ${accountStr.slice(-4)}`;
    }
    
    getLastTransactions(limit = 5) {
        return this.transactions.slice(-limit).reverse();
    }
    
    toString() {
        return `Conta Nº: ${this.number}, Cliente: ${this.holder}, Saldo: R$ ${this.balance.toFixed(2)}`;
    }
}

let currentAccount = null;
let pendingAction = null;

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário de criação
    const accountNumber = document.getElementById('account-number');
    const accountHolder = document.getElementById('account-holder');
    const initialDepositYes = document.getElementById('initial-deposit-yes');
    const initialDepositNo = document.getElementById('initial-deposit-no');
    const initialDepositContainer = document.getElementById('initial-deposit-container');
    const initialDeposit = document.getElementById('initial-deposit');
    const createAccountBtn = document.getElementById('create-account-btn');
    
    // Elementos de operações
    const accountCreationSection = document.getElementById('account-creation');
    const accountOperationsSection = document.getElementById('account-operations');
    const accountInfo = document.getElementById('account-info');
    const accountNumberDisplay = document.getElementById('account-number-display');
    const cardHolderName = document.getElementById('card-holder-name');
    const balanceAmount = document.getElementById('balance-amount');
    const transactionsList = document.getElementById('transactions-list');
    const depositAmount = document.getElementById('deposit-amount');
    const depositBtn = document.getElementById('deposit-btn');
    const withdrawAmount = document.getElementById('withdraw-amount');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const newAccountBtn = document.getElementById('new-account-btn');
    const userName = document.getElementById('user-name');
    
    // Modal de confirmação
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    const closeModal = document.querySelector('.close-modal');
    
    // Adicionar limitador de dígitos para o número da conta
    accountNumber.addEventListener('input', function() {
        // Remove qualquer caractere não numérico
        this.value = this.value.replace(/\D/g, '');
        
        // Limita a 12 dígitos
        if (this.value.length > 12) {
            this.value = this.value.slice(0, 12);
        }
    });
    
    // Event listeners
    initialDepositYes.addEventListener('change', function() {
        initialDepositContainer.style.display = 'block';
    });
    
    initialDepositNo.addEventListener('change', function() {
        initialDepositContainer.style.display = 'none';
        initialDeposit.value = '';
    });
    
    createAccountBtn.addEventListener('click', function() {
        // Validar entradas
        if (!accountNumber.value || !accountHolder.value) {
            showNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
            return;
        }
        
        const number = parseInt(accountNumber.value);
        
        // Verificação do tamanho do número da conta
        if (accountNumber.value.length > 12) {
            showNotification('O número da conta deve ter no máximo 12 dígitos!', 'error');
            return;
        }
        
        const holder = accountHolder.value.trim();
        
        if (initialDepositYes.checked && (!initialDeposit.value || parseFloat(initialDeposit.value) <= 0)) {
            showNotification('Por favor, informe um valor válido para o depósito inicial!', 'error');
            return;
        }
        
        // Criar nova conta
        if (initialDepositYes.checked) {
            const amount = parseFloat(initialDeposit.value);
            currentAccount = new Account(number, holder, amount);
        } else {
            currentAccount = new Account(number, holder);
        }
        
        // Atualizar interface
        updateAccountInfo();
        updateTransactionsHistory();
        accountCreationSection.style.display = 'none';
        accountOperationsSection.style.display = 'flex';
        
        // Atualizar nome do usuário
        userName.textContent = `Olá, ${holder}`;
        
        showNotification('Conta criada com sucesso!', 'success');
    });
    
    depositBtn.addEventListener('click', function() {
        if (!depositAmount.value || parseFloat(depositAmount.value) <= 0) {
            showNotification('Por favor, informe um valor válido para depósito!', 'error');
            return;
        }
        
        const amount = parseFloat(depositAmount.value);
        
        // Confirmar depósito
        showConfirmationModal(
            'Confirmar Depósito',
            `Você está prestes a depositar <b> R$ ${amount.toFixed(2)} </b>. Deseja continuar?`,
            function() {
                if (currentAccount.deposit(amount)) {
                    updateAccountInfo();
                    updateTransactionsHistory();
                    depositAmount.value = '';
                    showNotification('Depósito realizado com sucesso!', 'success');
                } else {
                    showNotification('Erro ao realizar depósito. Verifique o valor informado.', 'error');
                }
            }
        );
    });
    
    withdrawBtn.addEventListener('click', function() {
        if (!withdrawAmount.value || parseFloat(withdrawAmount.value) <= 0) {
            showNotification('Por favor, informe um valor válido para saque!', 'error');
            return;
        }
        
        const amount = parseFloat(withdrawAmount.value);
        const totalAmount = amount + 5.0; // Taxa de saque
        
        // Verificar saldo antes de mostrar modal
        if (currentAccount.balance < totalAmount) {
            showNotification(`Saldo insuficiente. Você precisa de R$ ${totalAmount.toFixed(2)} (valor + taxa).`, 'error');
            return;
        }
        
        // Confirmar saque
        showConfirmationModal(
            'Confirmar Saque',
            `Você está prestes a sacar <b> R$ ${amount.toFixed(2)} </b> + R$ 5,00 de taxa. Total: <b> R$ ${totalAmount.toFixed(2)} </b>. Deseja continuar?`,
            function() {
                if (currentAccount.withdraw(amount)) {
                    updateAccountInfo();
                    updateTransactionsHistory();
                    withdrawAmount.value = '';
                    showNotification('Saque realizado com sucesso!', 'success');
                } else {
                    showNotification('Erro ao realizar saque. Verifique o valor informado e seu saldo disponível.', 'error');
                }
            }
        );
    });
    
    // Criar nova conta
    newAccountBtn.addEventListener('click', function() {
        if (currentAccount) {
            showConfirmationModal(
                'Criar Nova Conta',
                'Ao criar uma nova conta, você perderá acesso à conta atual. Deseja continuar?',
                resetApplication
            );
        } else {
            resetApplication();
        }
    });
    
    // Fechar modal
    modalCancel.addEventListener('click', function() {
        hideModal();
    });
    
    closeModal.addEventListener('click', function() {
        hideModal();
    });
    
    // Função para mostrar o modal de confirmação
    function showConfirmationModal(title, message, confirmCallback) {
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;
        pendingAction = confirmCallback;
        
        modalConfirm.addEventListener('click', confirmModal);
        
        modal.style.display = 'flex';
    }
    
    // Função de confirmação do modal
    function confirmModal() {
        hideModal();
        if (typeof pendingAction === 'function') {
            pendingAction();
            pendingAction = null;
        }
        // Remover o listener após a confirmação
        modalConfirm.removeEventListener('click', confirmModal);
    }
    
    function hideModal() {
        modal.style.display = 'none';
    }
    
    // Função para resetar a aplicação
    function resetApplication() {
 
        accountNumber.value = '';
        accountHolder.value = '';
        initialDepositNo.checked = true;
        initialDepositContainer.style.display = 'none';
        initialDeposit.value = '';
        depositAmount.value = '';
        withdrawAmount.value = '';
        
        userName.textContent = 'Olá, Cliente';
        
        currentAccount = null;
        
        accountOperationsSection.style.display = 'none';
        accountCreationSection.style.display = 'block';
    }
    
    // Função para atualizar informações da conta na interface
    function updateAccountInfo() {
        if (currentAccount) {
            // Atualizar o card da conta
            accountNumberDisplay.textContent = currentAccount.getCardNumber();
            cardHolderName.textContent = currentAccount.holder.toUpperCase();
            balanceAmount.textContent = `R$ ${currentAccount.balance.toFixed(2)}`;
            
            accountInfo.innerHTML = `
                <div class="balance-label">Saldo Disponível</div>
                <div class="balance-amount">R$ ${currentAccount.balance.toFixed(2)}</div>
            `;
        }
    }
    
    // Função para atualizar o histórico de transações
    function updateTransactionsHistory() {
        if (!currentAccount || currentAccount.transactions.length === 0) {
            transactionsList.innerHTML = '<div class="no-transactions">Nenhuma transação realizada.</div>';
            return;
        }
        
        const transactions = currentAccount.getLastTransactions();
        let html = '';
        
        transactions.forEach(transaction => {
            const isDeposit = transaction.amount > 0;
            const formattedDate = formatDate(transaction.date);
            
            html += `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-title">${transaction.description}</div>
                        <div class="transaction-date">${formattedDate}</div>
                    </div>
                    <div class="transaction-amount ${isDeposit ? 'transaction-deposit' : 'transaction-withdraw'}">
                        ${isDeposit ? '+' : ''}R$ ${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                </div>
            `;
        });
        
        transactionsList.innerHTML = html;
    }
    
    // Formatar data
    function formatDate(date) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Intl.DateTimeFormat('pt-BR', options).format(date);
    }
    
    // Função para mostrar notificações
    function showNotification(message, type = 'info') {
        // Implementar um sistema de notificação aqui
        // Por enquanto, usamos o alert simples
        alert(message);
    }
    
    // Inicializar interface
    resetApplication();
    
    // Funcionalidade da barra lateral e itens de menu (Em breve)
    const menuItems = document.querySelectorAll('nav ul li');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Eu poderia adicionar navegação para outras páginas
            if (!this.classList.contains('active')) {
                showNotification('Esta funcionalidade estará disponível em breve!', 'info');
            }
        });
    });
});
