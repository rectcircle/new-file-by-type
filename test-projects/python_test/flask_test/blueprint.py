# -*- coding: utf8 -*-
# Copyright (c) 2019, Rectcircle. All rights reserved.
# @author Rectcircle
# @date 2019-06-13
# @version 0.0.1
from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for
)

bp = Blueprint('blueprint', __name__, url_prefix='/blueprint')


@bp.route('/path', methods=('GET',))
def view():
  pass # TODO: happy coding! (created by vscode extension new-file-by-type)
