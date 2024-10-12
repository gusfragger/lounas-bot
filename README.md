# Lounas Bot

This is a slackbot which scrapes lunches of websites, then pastes the result in slack.
It also takes votes on where to eat lunch.

## Deployment

1. Setup aws cli for some environment where you wish to deploy it
2. [Install elastic beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html)
3. `eb init`, to initiate elastic beanstalk
4. `eb create`, to create the elastic beanstalk environment
5. `eb deploy`
6. Go to the elastic beanstalk environment -> set environment variables to correct secrets

Done!

Currently, I'm not quite sure how to deal with shared state management. Future problem.
