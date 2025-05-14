const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

fetchRandomProduct().then(product => {
    currentItem = product;
});


async function fetchRandomProduct() {
    try {
        const res = await fetch('https://fakestoreapi.com/products');
        const products = await res.json();
        const randomProduct = products[Math.floor(Math.random() * products.length)];

        const currentItem = {
            name: randomProduct.title,
            description: randomProduct.description,
            image: randomProduct.image,
            startPrice: randomProduct.price,
            highestBid: randomProduct.price,
            highestBidder: null
        };

        console.log(currentItem);
        return currentItem;
    } catch (err) {
        console.error('Erro ao buscar produto:', err);
    }
}


let auctionTime = 60;
let timer;
let auctionOngoing = false;

function startAuction() {
    auctionOngoing = true;
    currentItem.highestBid = currentItem.startPrice;
    currentItem.highestBidder = null;

    io.emit('auction-started', {
        ...currentItem,
        time: auctionTime
    });

    timer = setInterval(() => {
        auctionTime--;
        io.emit('timer-update', auctionTime);

        if (auctionTime <= 0) {
            clearInterval(timer);
            auctionOngoing = false;
            io.emit('auction-ended', {
                itemName: currentItem.name,
                winner: currentItem.highestBidder || 'Ninguém',
                amount: currentItem.highestBid.toFixed(2)
            });
        }
    }, 1000);
}

io.on('connection', (socket) => {
    console.log('Novo usuário conectado');

    socket.on('join-auction', (username) => {
        socket.username = username;
        socket.emit('connected', 'Conectado com sucesso!');
        if (!auctionOngoing) {
            startAuction();
        } else {
            socket.emit('auction-started', {
                ...currentItem,
                time: auctionTime
            });
        }
    });

    socket.on('place-bid', (amount) => {
        const bid = parseFloat(amount);
        if (!auctionOngoing) return;

        if (bid > currentItem.highestBid) {
            currentItem.highestBid = bid;
            currentItem.highestBidder = socket.username;

            io.emit('new-highest-bid', {
                amount: bid.toFixed(2),
                bidder: socket.username
            });

            io.emit('log-event', `${socket.username} deu um lance de R$ ${bid.toFixed(2)}`);
        } else {
            socket.emit('bid-rejected', 'Lance muito baixo. Tente um valor maior.');
        }
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
