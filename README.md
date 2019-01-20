# Internet Banking

## Getting started

- Final term project for subject **_New Technology in Software development_** [(HCMUS)](https://www.hcmus.edu.vn/)
- This is a fork from the [original](https://github.com/vancam038/CNM-DACK-InternetBanking-038-051-100) to complete what haven't done in time to meet my taste (mostly in front-end)
- Use `NodeJs/ExpressJS` for back-end; `ReactJS/Redux` for front-end; `MySQL` for database
- Thank you [@vancam038](https://github.com/vancam038) for the journey as well as your great contribution

## Project structure

```
project
└── api_collection_postman
└── server // back-end
└── client // front-end
└── sql // database
      banking.sql // mysql
```

## Installation

### App

- server

  - change credentials for database connection in file `./server/src/fn/mysql-db.js`
  - change credentials to send OTP code in file `./server/nodemailer.js`
  - run `npm install` from `./server`

- client
  - run `npm install` from `./client`

### Database

- Use any MySQL database management tool to execute SQL file `./sql/banking.sql`
  - change records email in both `users` and `payacc` tables in order to receive OTP code to your email

## Build and run

- run `npm start` from `./server` for back-end server listening to `localhost:3000`
- run `npm start` from `./client` for front-end server listening to `localhost:3001`

### Demo account credentials 

(username - password)

- `staff` - `123` for staff functionalities
- `client`, `customer2`, `customer3` - `123` for customer functionalities

