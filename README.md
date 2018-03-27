# MedTagger

**MedTagger** is a collaborative framework for annotating **medical datasets**.

Main goal of this project was to design and develop software environment,
which helps in **aggregation and labeling** huge datasets of medical scans,
powered by idea of **crowdsourcing**. Platform also provides mechanism for
label **validation**, thus making produced datasets of labels more reliable
for the future use.

MedTagger is still **under heavy development**, so please keep in mind that
many things may change or new versions may not be fully backward compatible.
Contact with us directly in case you want to use our work :)

Documentation for the MedTagger can be found [here](/docs).

[![Build Status](https://travis-ci.org/jpowie01/MedTagger.svg?branch=master)](https://travis-ci.org/jpowie01/MedTagger)
<a href="https://docs.python.org/3/index.html"><img src="https://img.shields.io/badge/python-3.6-blue.svg"/></a>
<a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/></a>
<a href="https://www.python.org/dev/peps/pep-0008"><img src="https://img.shields.io/badge/code%20style-PEP8-brightgreen.svg"/></a>

## What is currently done?

 - [x] User Interface with dynamic 3D scans manipulation
 - [x] Backend architecture ready to be scaled up
 - [x] Basic labeling mechanism ready to be extended with new features
 - [x] Basic validation mechanism
 - [x] Basic users management system
 - [x] Dockerized and virtualized environment (with Vagrant)

## What needs to be done?

 - [ ] Extended labeling mechanism using magic lasso
   - [ ] Frontend
   - [x] Backend
 - [ ] Extended labeling mechanism using additional views for 3D scans
   - [ ] Frontend
   - [x] Backend
 - [ ] Extended validation mechanism for faster verification of similar labels
   - [ ] Frontend
   - [ ] Backend
 - [ ] Generating Machine Learning datasets on demand
   - [ ] Frontend
   - [ ] Backend

## MedTagger setup

MedTagger consists of two main parts:
 - `frontend` - User Interface application written in TypeScript & Angular ([more](/frontend)),
 - `backend` - system's architecture and API written in Python ([more](/backend)).

### Development

To set up MedTagger locally you can use Vagrant virtual machine:

```bash
$ vagrant up
```

Then follow up with our [documentation](/docs). Default development account is:
 - email: `admin@medtagger.com`,
 - password: `medtagger1`.

### Dockerized environment

MedTagger can be set up easily with Docker-Compose:

```bash
$ docker-compose up
```

More about setting up environment with Docker Compose can be found [here](/docs/setup_with_docker_compose.md).

## User Interface

Below screenshots show how MedTagger looks like:

#### Main Page
![Main Page](/docs/assets/main_page.png)

#### Labeling Page
![Labeling Page](/docs/assets/labelling_page.png)

#### Validation Page
![Validation Page](docs/assets/validation_page.png)

#### Upload Page
![Upload Page](docs/assets/upload_page.png)
