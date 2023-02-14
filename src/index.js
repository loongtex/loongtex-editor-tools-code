/**
 * Build styles
 */
import '../css/index.css';
import '../css/prism.css'
import { getLineStartPosition } from './utils/string';
import { IconBrackets } from '@codexteam/icons';
import Prism from 'prismjs'
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
export default class CodePlus {
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
      language: 'code-plus-language'
    };

    this.nodes = {
      holder: null,
      div: null,
      languageText: null,
      codePlusLibraryMenu: null,
      languageMenu: null
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

    if (this.data.language && this.data.language != '纯文本') {
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

    wrapper.addEventListener('mouseenter', () => this.wrapperMouseEnter())
    wrapper.addEventListener('mouseleave', () => this.wrapperMouseLeave())

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
      languageOptions = this.make('div', 'code-plus-language-options'),
      line = this.make('div', 'code-plus-line'),
      copy = this.make('div', 'code-plus-copy'),
      svg = document.createElementNS(SVG_NS, "svg"),
      path = document.createElementNS(SVG_NS, "path"),

      svgCopy = document.createElementNS(SVG_NS, "svg"),
      pathCopy = document.createElementNS(SVG_NS, "path"),
      svgWrapper = this.make('div', [this.CSS.svgWrapper]),
      spanCopy = document.createElement('span');

    spanCopy.textContent = 'Copy';


    path.setAttribute("d", "M14.566 7.434a.8.8 0 010 1.132l-4 4a.8.8 0 01-1.132 0l-4-4a.8.8 0 111.132-1.132L10 10.87l3.434-3.435a.8.8 0 011.132 0z");
    path.setAttribute("fill", "rgba(55, 53, 47, 0.65)");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    svg.setAttribute("width", 16);
    svg.setAttribute("height", 16);
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.classList.add('code-plus-language-svg');

    pathCopy.setAttribute("d", "M11.804,1.33469C11.7321,0.588495,11.0987,0,10.3344,0L3.69087,0L3.54921,0.00679126C2.80302,0.0786704,2.21452,0.71212,2.21452,1.47635L2.214,2.217L1.47635,2.21725L1.33469,2.22404C0.588495,2.29592,0,2.92937,0,3.6936L0,10.3372L0.00679126,10.4788C0.0786704,11.225,0.71212,11.8135,1.47635,11.8135L8.11991,11.8135L8.26156,11.8067C9.00776,11.7348,9.59626,11.1014,9.59626,10.3372L9.596,9.596L10.3344,9.59626L10.4761,9.58946C11.2223,9.51758,11.8108,8.88414,11.8108,8.11991L11.8108,1.47635L11.804,1.33469ZM10.3343,0.959595L3.6907,0.959595C3.43233,0.959595,3.21088,1.15152,3.18136,1.40988L3.17397,1.47632L3.17383,2.21697L8.11974,2.21722C8.88396,2.21722,9.51741,2.80572,9.58929,3.55191L9.59608,3.69357L9.59583,8.63597L10.3343,8.6366C10.5926,8.6366,10.8141,8.44467,10.8436,8.18631L10.851,8.11988L10.851,1.47632C10.851,1.21796,10.6591,0.996503,10.4007,0.966976L10.3343,0.959595ZM8.11975,3.17688L1.47619,3.17688C1.21783,3.17688,0.996381,3.3688,0.966854,3.62717L0.959473,3.6936L0.959473,10.3372C0.959473,10.5955,1.1514,10.817,1.40976,10.8465L1.47619,10.8539L8.11975,10.8539C8.37812,10.8539,8.59957,10.662,8.6291,10.4036L8.63648,10.3372L8.63648,3.6936C8.63648,3.43524,8.44455,3.21379,8.18619,3.18426L8.11975,3.17688Z");
    pathCopy.setAttribute("fill", "#595959");
    pathCopy.setAttribute("fill-rule", "evenodd");
    svgCopy.setAttribute("width", 12);
    svgCopy.setAttribute("height", 12);
    svgCopy.setAttribute("viewBox", "0 0 12 12");

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
        this.nodes.div.textContent = this.data.code;
      }

      event.preventDefault();
    })

    languageOptions.addEventListener('mouseleave', () => {
      if (languageOptions.style.opacity === '1') {
        languageOptions.style.opacity = '0';
        languageOptions.style.pointerEvents = 'none';
        svg.style.transform = 'rotate(0deg)';
      } else {
        languageOptions.style.opacity = '1';
        languageOptions.style.pointerEvents = 'all';
        svg.style.transform = 'rotate(-180deg)';
      }
    })

    languageMenu.appendChild(languageItem);
    languageMenu.appendChild(languageOptions);

    selectLangueMenu.appendChild(languageMenu);

    selectLangueMenu.appendChild(line);


    svgCopy.appendChild(pathCopy);
    svgWrapper.appendChild(svgCopy);
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

    languageItem.addEventListener('click', () => {
      if (languageOptions.style.opacity === '1') {
        languageOptions.style.opacity = '0';
        languageOptions.style.pointerEvents = 'none';
        svg.style.transform = 'rotate(0deg)';
      } else {
        languageOptions.style.opacity = '1';
        languageOptions.style.pointerEvents = 'all';
        svg.style.transform = 'rotate(-180deg)';
      }
    })

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
    return Prism.highlight(this.data.code, Prism.languages[text.toLocaleLowerCase()], text.toLocaleLowerCase())
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

  languageTextMouseEnter(event) {
    const { top, right } = event.target.getBoundingClientRect();
    const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
    const bodyWidth = document.body.clientWidth || document.documentElement.width;
    if (!this.nodes.codePlusLibraryMenu) {
      this.makeLanguageMenu();
    }
    if (!document.body.contains(this.nodes.codePlusLibraryMenu)) {
      document.body.appendChild(this.nodes.codePlusLibraryMenu);
    }
    const libraryHeight = this.nodes.codePlusLibraryMenu.offsetHeight;
    this.nodes.codePlusLibraryMenu.style.top = `${(top - 7 - libraryHeight + scrollTop)}px`;
    this.nodes.codePlusLibraryMenu.style.right = `${bodyWidth - right}px`;
  }
  wrapperMouseEnter() {
    if((this.nodes.languageMenu.style.opacity === '' || this.nodes.languageMenu.style.opacity === '0') ){
      this.nodes.languageMenu.style.opacity = '1';
    }
  }
  wrapperMouseLeave() {
    if((this.nodes.languageMenu.style.opacity==='1') ){
      this.nodes.languageMenu.style.opacity = '0';
    }
  }
}