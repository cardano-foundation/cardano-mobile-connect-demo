# cardano-mobile-connect-demo

A demonstration project showcasing **CIP-158** implementation and peer-to-peer transaction signing between devices in the Cardano ecosystem.

## Project Goal

This project serves two primary purposes:

1. **CIP-158 Demo**: Demonstrates the implementation of [CIP-158](https://github.com/cardano-foundation/CIPs/pull/1058) for secure communication between decentralized applications and wallets.

2. **P2P Transaction Signing**: Provides a peer-to-peer connection mechanism between two devices, enabling secure transaction signing without relying on centralized infrastructure.

## Architecture

The project is structured into two main components:

### dApp (cardano-client)

The decentralized application component that initiates transactions and interacts with the wallet.

**Tech Stack:**
- Framework: React and Vite.js
- Communication Protocol: CIP-158

### Wallet (wallet-client)

The wallet component used for emulating behavior of a wallet.

**Tech Stack:**
- Framework: Native Java Android App + HTML/JS/CSS Wallet Connector with PeerJS
- Communication Protocol: PeerJS/WebRTC

## Features

- Secure peer-to-peer communication between dApp and wallet
- CIP-158 compliant implementation
- Decentralized transaction signing
- No centralized server required for P2P connection
- Cross-device compatibility

## Getting Started

### Installation

In cardano-client run:

```bash
npm install
```

### Running the Project

#### Starting the Wallet Client

Open in Android Studio and run in an Emulator or on Device

#### Starting the dApp Client

```bash
npm run dev -- --host
```

## Usage

For testing the CIP-158 in App Browser, open the dApp in a Browser and click on Open Wallet in the Dropdown menu. This should open the installed Demo Wallet via DeepLink and load the dApp in the in App Browser.

For Testing the QR p2p Connection open the dApp in any Browser and scan the QR Code in the Dropdown menu with the demo Wallet.

## Known Challenges

- PeerJS sometimes cant make a connection/ wont give a PeerID to a client. Im unsure why at the moment.
- The in App Browser currently only loads the dApp but cant communicate with the wallet. This is tbd.
- Currently the dApp and the wallet can make a connection via PeerJS but signing is not finished yet.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
