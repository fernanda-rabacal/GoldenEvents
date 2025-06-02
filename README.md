# Golden Events

This is a collaborative full stack project of a website where you can see the latest events near to you, see the details of it, register or login in your account to buy a ticket and/or create an event. Besides, you can see and edit your profile, see the order history, edit or delete your created events and many more. This project is made with Next.js e Express.js, also using Sass and Prisma, using JWT authentication, data validation, MySQL database and Docker.

<div>
  <img align="center" style="margin-bottom:50px;" src="https://github.com/fernanda-rabacal/GoldenEvents/assets/99514714/8d93fedd-8cb9-4cfb-9473-6155ec0ee3f8" />
</div>
-
<div>

  ![image](https://github.com/fernanda-rabacal/GoldenEvents/assets/99514714/c7681619-0549-42d9-a42d-9223795b771e)

</div>

### Status: In progress 🚧

#### Doing:
- Order history

### How to run:

This repository has the frontend and the backend of the application. Clone the repository on your machine and enter the respective folders to run the comands below if you wanna run locally or use Docker. 
To use this code without Docker, you need to have Node.js and npm installed. Also, you need to have MySQL server. 

  - Backend

  Make sure to make a connection to MySQL using the credentials on the .env file. 
  Enter the backend folder and run:

  ##### `npm install` to install the dependencies.
  ##### `npx prisma migrate dev` to make the database.
  ##### `npm start` to start the server on http://localhost:8080

  - Frontend

  Enter the frontend folder e just run `npm run dev`.

  - Docker

  On the root folder, run `docker compose build` to build the containers. After, just run `docker compose up` to start the containers. If you like, use the flag `-d` on this command to detach the docker log off the terminal.

  
### Technologies 🧰

<div>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white"> 
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"> 
  <img src="https://img.shields.io/badge/next%20js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Docker-0db7ed?style=for-the-badge&logo=docker&logoColor=white" /> 
</div>
