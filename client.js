const socket = io();

const connectionStatus = document.getElementById('connection-status');
const userSetup = document.getElementById('user-setup');
const connectBtn = document.getElementById('connect-btn');
const usernameInput = document.getElementById('username');

const auctionArea = document.getElementById('auction-area');
const itemName = document.getElementById('item-name');
const itemDesc = document.getElementById('item-description');
const itemImage = document.getElementById('item-image');
const itemStartPrice = document.getElementById('item-start-price');

const highestBid = document.getElementById('highest-bid');
const highestBidder = document.getElementById('highest-bidder');
const timerDisplay = document.getElementById('timer');

const bidAmount = document.getElementById('bid-amount');
const placeBidBtn = document.getElementById('place-bid-btn');
const bidFeedback = document.getElementById('bid-feedback');

const logList = document.getElementById('log-list');

const auctionEndedMsg = document.getElementById('auction-ended-message');
const endedItemName = document.getElementById('ended-item-name');
const winnerName = document.getElementById('winner-name');
const winningBid = document.getElementById('winning-bid');

connectBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        socket.emit('join-auction', username);
    }
});

placeBidBtn.addEventListener('click', () => {
    const bid = parseFloat(bidAmount.value);
    if (!isNaN(bid)) {
        socket.emit('place-bid', bid);
    }
});

socket.on('connected', (msg) => {
    connectionStatus.textContent = msg;
    userSetup.classList.add('hidden');
    auctionArea.classList.remove('hidden');
});

socket.on('auction-started', (item) => {
    auctionEndedMsg.classList.add('hidden');
    itemName.textContent = item.name;
    itemDesc.textContent = item.description;
    itemImage.src = item.image;
    itemStartPrice.textContent = item.startPrice.toFixed(2);
    highestBid.textContent = item.startPrice.toFixed(2);
    highestBidder.textContent = '-';
    placeBidBtn.disabled = false;
    updateTimer(item.time);
});

socket.on('new-highest-bid', (data) => {
    highestBid.textContent = data.amount;
    highestBidder.textContent = data.bidder;
    bidFeedback.textContent = '';
});

socket.on('timer-update', (time) => {
    updateTimer(time);
});

socket.on('bid-rejected', (msg) => {
    bidFeedback.textContent = msg;
});

socket.on('log-event', (msg) => {
    const li = document.createElement('li');
    li.textContent = msg;
    logList.appendChild(li);
});

socket.on('auction-ended', (data) => {
    auctionEndedMsg.classList.remove('hidden');
    endedItemName.textContent = data.itemName;
    winnerName.textContent = data.winner;
    winningBid.textContent = data.amount;
    placeBidBtn.disabled = true;
});

function updateTimer(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${min}:${sec}`;
}
