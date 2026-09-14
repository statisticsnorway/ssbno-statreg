# Coding practices and conventions in this project

## Datetime

* Frontend uses local datetime
* Backend handles all datetimes as UTC
* All datetimes in database are stored in UTC
* All dates only (_'YYYY-MM-DD'_) are by default handled as strings

## Sanitation, validation and parsing in service layer

As a rule of thumb we:

* Sanitize, then parse. Validation are done as a part of parsing
* Validate parameters and resources given from path parameters, then parse body
* Functions named `assert...` or `validate...` returns boolean, `parse...` returns parsed object
