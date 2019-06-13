# -*- coding: utf8 -*-
# Copyright (c) 2019, Rectcircle. All rights reserved.
# @author Rectcircle
# @date 2019-06-13
# @version 0.0.1
from flask import Flask


def create_app(test_config=None):
  # create and configure the app
  app = Flask(__name__, instance_relative_config=True)
  app.config.from_mapping(
    SECRET_KEY='dev',
    DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
  )

  if test_config is None:
    # load the instance config, if it exists, when not testing
    app.config.from_pyfile('config.py', silent=True)
  else:
    # load the test config if passed in
    app.config.from_mapping(test_config)

  # ensure the instance folder exists
  try:
    os.makedirs(app.instance_path)
  except OSError:
    pass

  # a simple page that says hello
  @app.route('/hello')
  def hello():
    return 'Hello, World!'
  # TODO: happy coding! (created by vscode extension new-file-by-type)

  return app
