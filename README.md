# SismoC

Creation of a zero-knowledge attester on chain, using the Semaphore protocol, with the goal of integrating it with the other Sismo attesters.

## How does it work?

<div align="center">
  <img src=".github/assets/AttesterExplained.png" />
</div>

## Getting Started

### Installation
⚠️ To use this project, please be sure to run the following command at the root of the repository : `nvm use`

Clone the [sismo-core repository](https://github.com/sismo-core/sismo-protocol) as `sismo-protocol-main/` in `./sismo/contracts` to make the attester works

You must install all dependencies for the Semaphore application, Semaphore contract and Sismo attester using `npm install` or `yarn`.

### Usage
#### Setup project
1. Deploy the Semaphore contracts
2. Setup a `./sismo/.env` using `./sismo/.env.example`
3. Deploy the Attester contracts
4. Setup a `./semaphore-app/.env` using `./semaphore-app/.env.example`
5. Run the Semaphore app : `yarn start`

#### Create semaphore identity & get attestation
On the Semaphore app, follow the instructions on the user interface

1. Create identidy
2. Join Group
3. Generate attestation

## Get involved

You're invited to join this project ! Check out the [contributing guide](./CONTRIBUTING.md).

If you're interested in how the project is organized at a higher level, please contact the current project manager.

## Our PoC team :heart:

Developers
| [<img src="https://github.com/ZerLock.png?size=85" width=85><br><sub>Léo Dubosclard</sub>](https://github.com/ZerLock) | [<img src="https://github.com/Alex-Prevot.png?size=85" width=85><br><sub>Alex PREVOT</sub>](https://github.com/Alex-Prevot) | [<img src="https://github.com/MrSIooth.png?size=85" width=85><br><sub>Victor Guyot</sub>](https://github.com/MrSIooth)
| :---: | :---: | :---: |

Manager
| [<img src="https://github.com/Doozers.png?size=85" width=85><br><sub>Ismaël FALL</sub>](https://github.com/Doozers)
| :---: |

<h2 align=center>
Organization
</h2>

<p align='center'>
    <a href="https://www.linkedin.com/company/pocinnovation/mycompany/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white">
    </a>
    <a href="https://www.instagram.com/pocinnovation/">
        <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white">
    </a>
    <a href="https://twitter.com/PoCInnovation">
        <img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white">
    </a>
    <a href="https://discord.com/invite/Yqq2ADGDS7">
        <img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white">
    </a>
</p>
<p align=center>
    <a href="https://www.poc-innovation.fr/">
        <img src="https://img.shields.io/badge/WebSite-1a2b6d?style=for-the-badge&logo=GitHub Sponsors&logoColor=white">
    </a>
</p>

> :rocket: Don't hesitate to follow us on our different networks, and put a star 🌟 on `PoC's` repositories

> Made with :heart: by PoC
