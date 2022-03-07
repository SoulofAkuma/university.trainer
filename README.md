A tool to show markdown files line by line, query given markdown files and auto reload files on modification. Supports inline and block math mode with Mathjax. Works completely offline (open an issue if I forgot to add necessary matjax fonts and some rendering looks off).

To use clone/download the repository: 
- [Install Nodejs together with NPM](https://nodejs.org/en/download/)
- Open CMD/a Shell and navigate to the folder conataining the clone/download
- Install Nodejs dependencies by typing `npm install --save`
- (Optional for javascript development to trigger server restart on file modification)
    - install nodemon with `npm install -g nodemon --save`
- Start the server with `node server.js` or `nodemon --inspect server.js` (if you followed the optional step)
- Access the server through [http://localhost:8181](http://localhost:8181) and query your markdown files 