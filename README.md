# Internet Banking

## Getting started

- Final term project for subject **_New Technology in Software development_** (HCMUS)
- This is a fork from the [original](https://github.com/vancam038/CNM-DACK-InternetBanking-038-051-100) to complete what haven't done in time to meet my taste (mostly in front-end)
- Using NodeJs/ExpressJS for back-end; ReactJS/Redux for front-end; MySQL for database
- Thank you [@vancam038](https://github.com/vancam038) for the journey as well as your great contribution

## Todo

- [ ] fully integrate redux and refactor code for PayAccClient and InternalTransfer pages
- [ ] better responsive (for mobile devices?)
- [ ] add auto-completion for searching customer's contacts
- [ ] use `webpack`

## Project structure

```
project
└── server // back-end
└── client // front-end
└── sql // database
      banking.sql // mysql
```

## Installation

### App

- server

  - change credentials for database connection in file `./server/src/fn/mysql-db.js`
  - change credentials to send OTP code in fle `./server/nodemailer.js`
  - then run the following in `server` root folder
    ```
    npm install
    ```

- client
  - simply run the following in `client` root folder
    ```
    npm install
    ```

### Database

- Use any MySQL database management tool to execute SQL file `./sql/banking.sql`
  - change records email in both `users` and `payacc` tables in order to receive OTP code to your email

## Buid and run

- run `npm start` in `server` root folder to start back-end server listening to `localhost:3000`
- run `npm start` in `client` root folder to start front-end server listening to `localhost:3001`
