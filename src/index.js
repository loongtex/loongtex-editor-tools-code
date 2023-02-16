/**
 * Build styles
 */
import '../css/index.css';
import '../css/prism.css'
import { getLineStartPosition } from './utils/string';
import { IconBrackets } from '@codexteam/icons';
import Prism from 'prismjs'
import { IconCopy } from '@codexteam/icons';
/**
 * CodeTool for Editor.js
 *
 * @author CodeX (team@ifmo.su)
 * @copyright CodeX 2018
 * @license MIT
 * @version 2.0.0
 */

/* global PasteEvent */

/**
 * Code Tool for the Editor.js allows to include code examples in your articles.
 */
export default class CodeTool {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Allow to press Enter inside the CodeTool div
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  get defaultLanguages() {
    return ['纯文本', 'Css', 'Python', 'Git', 'JavaScript', 'Go', 'C', 'C++', 'Rust', 'Java']
  }

  /**
   * @typedef {object} CodeData — plugin saved data
   * @property {string} code - previously saved plugin code
   */

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {object} options - tool constricting options
   * @param {CodeData} options.data — previously saved plugin code
   * @param {object} options.config - user config for Tool
   * @param {object} options.api - Editor.js API
   * @param {boolean} options.readOnly - read only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

    this.placeholder = this.api.i18n.t(config.placeholder || CodeTool.DEFAULT_PLACEHOLDER);

    this.CSS = {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,
      wrapper: 'code-plus',
      div: 'code-plus__inside',
      svgWrapper: 'code-plus-svg-wrapper',
      divOutside: 'code-plus__outside',
      language: 'code-plus-language',
    };

    this.nodes = {
      holder: null,
      div: null,
      languageText: null,
      codePlusLibraryMenu: null,
      languageMenu: null,
      languageOutside: null,
      languageOptions: null
    };

    this.data = {
      code: data.code || '',
      language: data.language || '纯文本',
    };

    this.languages = config.languages || this.defaultLanguages();

    this.range = null;
    this.selection = null;
    this.isEnterPress = false;

    this.nodes.holder = this.drawView();
  }

  /**
   * Create Tool's view
   *
   * @returns {HTMLElement}
   * @private
   */
  drawView() {
    const wrapper = this.make('div', [this.CSS.baseClass, this.CSS.wrapper]),
      inside = this.make('div', [this.CSS.div, this.CSS.input]),
      outside = this.make('div', [this.CSS.divOutside]);

    wrapper.style.position = "relative";
    inside.setAttribute("contenteditable", "true");
    inside.setAttribute("spellcheck", false)
    inside.setAttribute("data-placeholder", this.placeholder);
    if (this.data.language && this.data.language !== '纯文本') {
      inside.innerHTML = this.generateHtml(this.data.language.toLocaleLowerCase())
    } else {
      inside.textContent = this.data.code;
    }




    if (this.readOnly) {
      inside.setAttribute("contenteditable", false);
    }

    const languageMenu = this.makeLanguageMenu();

    outside.appendChild(inside);

    wrapper.appendChild(languageMenu);

    wrapper.appendChild(outside);
    inside.addEventListener("paste", (event) => this.insidePaste(event));
    inside.addEventListener("input", (event) => this.insideInput(event));
    inside.addEventListener("keydown", (event) => this.insideKeyDown(event));

    wrapper.addEventListener('mouseenter', (event) => this.wrapperMouseEnter(event))
    wrapper.addEventListener('mouseleave', (event) => this.wrapperMouseLeave(event))

    this.nodes.div = inside;


    return wrapper;
  }

  makeLanguageMenu() {
    const SVG_NS = "http://www.w3.org/2000/svg";

    const codePlusLibraryMenu = this.make('div', ['code-plus-library-menu', this.CSS.language]),
      selectLangueMenu = this.make('div', 'code-plus-select-language-menu'),
      languageMenu = this.make('div', 'code-plus-language-menu'),
      languageItem = this.make('div', 'code-plus-language-item'),
      languageText = this.make('span'),
      languageOutside = this.make('div', 'code-plus-language-outside'),
      languageOptions = this.make('div', 'code-plus-language-options'),
      copy = this.make('div', 'code-plus-copy'),
      svg = document.createElementNS(SVG_NS, "svg"),
      path = document.createElementNS(SVG_NS, "path"),
      svgWrapper = this.make('div', [this.CSS.svgWrapper]),
      spanCopy = document.createElement('span');

      svgWrapper.innerHTML = IconCopy;

    languageOutside.appendChild(languageOptions)
    this.nodes.languageOutside = languageOutside;
    this.nodes.languageOptions = languageOptions;
    languageOutside.addEventListener('click', () => {
      if (document.body.contains(languageOutside)) {
        document.body.removeChild(languageOutside);
      }
    })

    spanCopy.textContent = 'Copy';


    path.setAttribute("d", "M14.566 7.434a.8.8 0 010 1.132l-4 4a.8.8 0 01-1.132 0l-4-4a.8.8 0 111.132-1.132L10 10.87l3.434-3.435a.8.8 0 011.132 0z");
    path.setAttribute("fill", "rgba(55, 53, 47, 0.65)");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    svg.setAttribute("width", 16);
    svg.setAttribute("height", 16);
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.classList.add('code-plus-language-svg');


    languageText.textContent = this.data.language;
    this.nodes.languageText = languageText;
    languageItem.appendChild(languageText);
    svg.appendChild(path);
    languageItem.appendChild(svg);

    const fragment = document.createDocumentFragment();

    for (const language of this.languages) {
      const el = this.make('div', 'code-plus-language-option');
      el.textContent = language;
      fragment.appendChild(el)
    }

    languageOptions.appendChild(fragment);
    languageOptions.addEventListener('click', (event) => {
      const text = event.target.textContent;
      if (text && text !== '纯文本') {
        const html = this.generateHtml(text);
        if (html) {
          this.nodes.languageText.textContent = text;
          this.nodes.div.innerHTML = html;
        }
      } else {
        this.nodes.languageText.textContent = text;
        this.nodes.div.textContent = this.nodes.div.textContent;

      }

      if (document.body.contains(this.nodes.languageOutside)) {
        document.body.removeChild(this.nodes.languageOutside);
      }

      event.preventDefault();
      event.stopPropagation();
    })



    languageMenu.appendChild(languageItem);
    languageMenu.addEventListener('click', (event) => this.languageMenuClick(event))

    selectLangueMenu.appendChild(languageMenu);

    svgWrapper.appendChild(spanCopy);
    copy.appendChild(svgWrapper);


    selectLangueMenu.appendChild(copy);

    copy.addEventListener("click", () => {
      const oInput = document.createElement('input');
      oInput.value = this.nodes.div.textContent;
      document.body.appendChild(oInput);
      oInput.select();
      document.execCommand("Copy");
      oInput.className = 'oInput';
      oInput.style.display = 'none';
      svgWrapper.removeChild(spanCopy);
      spanCopy.textContent = 'Copied';
      svgWrapper.appendChild(spanCopy);
    })

    codePlusLibraryMenu.appendChild(selectLangueMenu);

    // codePlusLibraryMenu.addEventListener('mouseleave', () => {
    //   if (document.body.contains(codePlusLibraryMenu)) {
    //     document.body.removeChild(codePlusLibraryMenu);
    //   }
    // })

    this.nodes.codePlusLibraryMenu = codePlusLibraryMenu;
    this.nodes.languageMenu = selectLangueMenu;

    return codePlusLibraryMenu;

  }

  make(tagName, classNames = null, attributes = {}) {
    let el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (let attrName in attributes) {
      el[attrName] = attributes[attrName];
    }

    return el;
  }

  makeSvg(tagName, d, width, height, viewBox, fill, className = null) {
    let el = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", viewBox);
    if (className) {
      svg.classList.add(className);
    }

    return el

  }
  /**
   * Return Tool's view
   *
   * @returns {HTMLDivElement} this.nodes.holder - Code's wrapper
   * @public
   */
  render() {
    return this.nodes.holder;
  }

  /**
   * Extract Tool's data from the view
   *
   * @param {HTMLDivElement} codeWrapper - CodeTool's wrapper, containing div with code
   * @returns {CodeData} - saved plugin code
   * @public
   */
  save(codeWrapper) {
    return {
      code: codeWrapper.querySelector('.code-plus__inside').textContent,
      language: codeWrapper.querySelector('.code-plus-language-item').textContent,
    };
  }

  /**
   * Returns Tool`s data from private property
   *
   * @returns {CodeData}
   */
  get data() {
    return this._data;
  }

  /**
   * Set Tool`s data to private property and update view
   *
   * @param {CodeData} data - saved tool data
   */
  set data(data) {
    this._data = data;

    if (this.nodes.div) {
      this.nodes.div.textContent = data.code;
    }
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: IconBrackets,
      title: 'Code',
    };
  }

  /**
   * Default placeholder for CodeTool's div
   *
   * @public
   * @returns {string}
   */
  static get DEFAULT_PLACEHOLDER() {
    return 'Enter a code';
  }

  /**
   *  Used by Editor.js paste handling API.
   *  Provides configuration to handle CODE tag.
   *
   * @static
   * @returns {{tags: string[]}}
   */
  static get pasteConfig() {
    return {
      tags: ['pre'],
    };
  }

  /**
   * Automatic sanitize config
   *
   * @returns {{code: boolean}}
   */
  static get sanitize() {
    return {
      code: true, // Allow HTML tags
    };
  }
  /**
 * 复制粘贴处理
 * @param e
 */
  textInit(event, value) {
    const selection = this.selection;
    const range = this.range;
    if (!selection.rangeCount) return false
    selection.getRangeAt(0).insertNode(document.createTextNode(value));
    this.nodes.div.normalize();
    var rangeStartOffset = range.startOffset;
    range.setStart(this.nodes.div.childNodes[0], rangeStartOffset + value.length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.range = range;
    this.selection = selection;
    event.preventDefault();
    event.stopPropagation();
  }

  pasteHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    let paste = (event.clipboardData || window.clipboardData).getData('text');
    this.textInit(event, paste)
  }

  /**
   * 获取光标的位置
   */
  cursorHandler() {
    this.selection = window.getSelection();
    this.range = this.selection.getRangeAt(0);
  }

  keyPressHandler(event) {
    event.preventDefault();
    // console.log( JSON.stringify(event.target.innerText).replace(/^\"|\"$/g,''));
    this.textInit(event, this.isEnterPress ? '\n' : '\n\n');
    this.isEnterPress = true;
  }

  /**
   * Handles Tab key pressing (adds/removes indentations)
   *
   * @private
   * @param {KeyboardEvent} event - keydown
   * @returns {void}
   */
  tabHandler(event) {
    /**
     * Prevent editor.js tab handler
     */
    event.stopPropagation();

    /**
     * Prevent native tab behaviour
     */
    event.preventDefault();

    const div = event.target;
    const isShiftPressed = event.shiftKey;
    const caretPosition = div.selectionStart;
    const value = div.textContent;
    const indentation = '  ';

    let newCaretPosition;

    /**
     * For Tab pressing, just add an indentation to the caret position
     */
    if (!isShiftPressed) {
      newCaretPosition = caretPosition + indentation.length;

      div.textContent = value.substring(0, caretPosition) + indentation + value.substring(caretPosition);
    } else {
      /**
       * For Shift+Tab pressing, remove an indentation from the start of line
       */
      const currentLineStart = getLineStartPosition(value, caretPosition);
      const firstLineChars = value.substr(currentLineStart, indentation.length);

      if (firstLineChars !== indentation) {
        return;
      }

      /**
       * Trim the first two chars from the start of line
       */
      div.textContent = value.substring(0, currentLineStart) + value.substring(currentLineStart + indentation.length);
      newCaretPosition = caretPosition - indentation.length;
    }

    /**
     * Restore the caret
     */
    div.setSelectionRange(newCaretPosition, newCaretPosition);
  }

  generateHtml(text) {
    return Prism.highlight(this.nodes.div ? this.nodes.div.textContent : this.data.code, Prism.languages[text.toLocaleLowerCase()], text.toLocaleLowerCase())
  }

  insidePaste(event) {
    this.pasteHandler(event);
    this.data = {
      code: this.nodes.div.textContent,
    }
  }

  insideInput() {
    this.cursorHandler();
    this.isEnterPress = false;
  }

  insideKeyDown(event) {
    this.cursorHandler();
    if (event.code.toLocaleLowerCase() === 'enter') {
      this.keyPressHandler(event);
    } else {
      this.isEnterPress = false;
    }
  }

  languageMenuClick(event) {
    const { bottom, left } = event.target.getBoundingClientRect();
    if (!document.body.contains(this.nodes.languageOutside)) {
      document.body.appendChild(this.nodes.languageOutside);
    }
    this.nodes.languageOptions.style.top = `${(bottom)}px`;
    this.nodes.languageOptions.style.left = `${left}px`;
  }
  wrapperMouseEnter(event) {
    event.preventDefault();
    event.stopPropagation()
    if ((this.nodes.languageMenu.style.opacity === '' || this.nodes.languageMenu.style.opacity === '0')) {
      this.nodes.languageMenu.style.opacity = '1';
    }
  }
  wrapperMouseLeave(event) {
    event.preventDefault();
    event.stopPropagation()
    if ((this.nodes.languageMenu.style.opacity === '1' && !document.body.contains(this.nodes.languageOutside))) {
      this.nodes.languageMenu.style.opacity = '0';
    }
  }
}