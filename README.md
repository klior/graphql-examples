
# GraphQL examples
  
Based on live coding of Oreilly course "Rethinking REST: A hands-on guide to GraphQL and Queryable APIs"  
https://www.oreilly.com/library/view/rethinking-rest-a/9780135381434/  
  
  
## Tools & Resources
  
https://developer.github.com/v4/explorer  
  
https://github.com/settings/tokens  
login to github > settings > developer settings > Personal access tokens > generate new token  
  
https://graphql.org/graphql-js/graphql-clients  


## Client
GraphQL features used:
queries  
arguments  
fragements  
aliases  
unions  
mutations  
variables  
  
Not covered:  
pagination  
introspection  
directives  
subscriptions  
  



***
***

# Rethinking REST
### A hands-on guide to GraphQL and queryable APIs

## Client
Requires a modern browser capable of running ES6 JavaScript

## Node server
Requires Node >= 8.9

`npm install` to install libraries

`npm start` to run

`knex seed:run` to reset seed data

## Django server
Requires Python 3.6 and Pipenv

`pip install pipenv` if you don't already have Pipenv

`pipenv --python 3.6` to create virtual environment

`pipenv install` to install libraries

`pipenv shell` to activate the virtual environment

`python manage.py runserver` to run

`python manage.py loaddata users books` to rest seed data