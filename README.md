# P4SBU_CSE416

## Summary
CSE 416 Project entailing the solutions to Stony Brook Campus parking. We developed a software to create an organized and simple user experience that our administration can integrate.

## Third Party API's

### Payments
To get around the requirement of not utilizing any paid 3rd parties, we had to utilize [Stripe](stripe.com) in test mode. Because of this, only test cards will work for payment. Here are all the possible cards, pulled from the [stripe docs](https://docs.stripe.com/testing?testing-method=card-numbers):
| Brand                        | Number                      | CVC             | Date            |
|------------------------------|-----------------------------|-----------------|-----------------|
| Visa                         | `4242 4242 4242 4242`       | Any 3 digits    | Any future date |
| Visa (debit)                 | `4000 0566 5566 5556`       | Any 3 digits    | Any future date |
| Mastercard                   | `5555 5555 5555 4444`       | Any 3 digits    | Any future date |
| Mastercard (2-series)        | `2223 0031 2200 3222`       | Any 3 digits    | Any future date |
| Mastercard (debit)           | `5200 8282 8282 8210`       | Any 3 digits    | Any future date |
| Mastercard (prepaid)         | `5105 1051 0510 5100`       | Any 3 digits    | Any future date |
| American Express             | `3782 822463 10005`         | Any 4 digits    | Any future date |
| American Express             | `3714 496353 98431`         | Any 4 digits    | Any future date |
| Discover                     | `6011 1111 1111 1117`       | Any 3 digits    | Any future date |
| Discover                     | `6011 0009 9013 9424`       | Any 3 digits    | Any future date |
| Discover (debit)             | `6011 9811 1111 1113`       | Any 3 digits    | Any future date |
| Diners Club                  | `3056 9300 0902 0004`       | Any 3 digits    | Any future date |
| Diners Club (14-digit card)  | `3622 720627 1667`          | Any 3 digits    | Any future date |
| BCcard and DinaCard          | `6555 9000 0060 4105`       | Any 3 digits    | Any future date |
| JCB                          | `3566 0020 2036 0505`       | Any 3 digits    | Any future date |
| UnionPay                     | `6200 0000 0000 0005`       | Any 3 digits    | Any future date |
| UnionPay (debit)             | `6200 0000 0000 0047`       | Any 3 digits    | Any future date |
| UnionPay (19-digit card)     | `6205 5000 0000 0000 004`   | Any 3 digits    | Any future date |
