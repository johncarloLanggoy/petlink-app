#!/bin/bash
gunicorn -w 1 --threads 4 app:app