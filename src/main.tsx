// SPDX-License-Identifier: GPL-3.0-only
import { render } from 'preact';
import { App } from './app/app';
import './styles/global.css';

const container = document.getElementById('app');
if (container) render(<App />, container);
