/**
 * Build styles
 */
import '../css/index.css';
import '../css/prism.css'
import { _getFrontOffset, selection, _getRealDomAndOffset } from './utils/string';
import { IconBrackets } from '@codexteam/icons';
import Prism from 'prismjs'
const getFrontOffset = _getFrontOffset();
const getRealDomAndOffset = _getRealDomAndOffset();
import copysvg from '../svg/copy.svg';
import successcopy from '../svg/deal.svg';
import select from '../svg/select.svg';
export default class CodeTool {
  /**
   * Notify core this read-only mode is supported
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
      languageOptions: null,
      input: null,
      languageOptionContainer: null,
      outside_container: null,
      drag: null
    };

    this.data = {
      code: data.code || '',
      language: data.language || '纯文本',
      lineNumber: data.lineNumber || 0,
    };

    this.languages = config.languages || this.defaultLanguages();

    this.range = null;
    this.selection = null;
    this.isEnterPress = false;

    this.isInput = true;

    this.dragState = {
      'startMouseTop': 0,
      'endMouseTop': 0,
    }
    this.TextAreaWrap = {
      MinHeight: 440,
      MaxHeight: this.data.lineNumber
    }
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
      outside_container = this.make('div', ['code-plus-outside-container']),
      drag = this.make('div', 'code-plus-drag'),
      dragBack = this.make('div','code-plus-drag-back'),
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

    outside_container.appendChild(outside);


    dragBack.appendChild(drag);
    this.nodes.outside_container = outside_container;

    this.nodes.drag = drag;
    this.nodes.dragBack = dragBack;
    if (this.TextAreaWrap.MaxHeight > this.TextAreaWrap.MinHeight) {
      outside_container.appendChild(dragBack);

    }

    drag.addEventListener('dblclick', () => {
      if (outside.style.maxHeight === 'none') {
        outside.style.maxHeight = '440px';
      } else {
        outside.style.maxHeight = 'none';
      }
    })

    drag.addEventListener('mousedown', (ev) => {
      document.onselectstart = () => false;
      document.ondragstart = () => false;

      this.dragState = {
        // 鼠标开始移动的位置（Y轴）
        'startMouseTop': ev.clientY,
        // 鼠标最后移动的位置（Y轴）
        'endMouseTop': ev.clientY
      }

      ev.target.style.cursor = 'ns-resize'

      // 绑定鼠标移动事件
      document.addEventListener('mousemove', handleMouseMove);
      // 绑定鼠标放开事件
      document.addEventListener('mouseup', handleMouseUp);

    })

    const that = this
    function handleMouseMove(event) {
      const rResizeLine = that.nodes.drag;
      const rTextareaWrap = outside;
      const TextAreaWrap = that.TextAreaWrap;

      // 获取鼠标最后移动的位置（Y轴）
      const { endMouseTop } = that.dragState;
      // 获取当前的文本框高度
      const oldTextAreaHeight = rTextareaWrap.getBoundingClientRect().height;
      // 新的文本框高度
      let newTextAreaHeight = 0;

      // 计算鼠标移动的距离
      const distance = Math.abs(
        parseInt(((endMouseTop - event.clientY) * 100).toString(), 10) / 100
      );

      // 若鼠标向下移动
      if (endMouseTop <= event.clientY) {
        // 发送框高度达到最大
        if (oldTextAreaHeight >= TextAreaWrap.MaxHeight) {
          // 修改光标为可被向上移动
          rResizeLine.style.cursor = 'n-resize';

          that.nodes.dragBack.style.backgroundImage = 'none';
          return false;
        }

        // 计算新的发送框高度
        newTextAreaHeight = oldTextAreaHeight + distance;
      }
      // 若鼠标向上移动
      else {

        // 发送框高度达到最小
        if (oldTextAreaHeight <= TextAreaWrap.MinHeight) {
          // 修改光标为可被向下移动
          rResizeLine.style.cursor = 's-resize';
          return false;
        }

        that.nodes.dragBack.style.backgroundImage = 'linear-gradient(-180deg, rgba(255, 255, 255, 0) 0%, #ebebeb 100%)'

        // 计算新的发送框高度
        newTextAreaHeight = oldTextAreaHeight - distance;
      }

      // 兼容鼠标快速拖动的情况：新的发送框高度不能超过最大值
      // if (newTextAreaHeight > TextAreaWrap.MaxHeight) {
      //   newTextAreaHeight = TextAreaWrap.MaxHeight;
      // }

      // // 兼容鼠标快速拖动的情况：新的发送框高度不能小于最小值
      // if (newTextAreaHeight < TextAreaWrap.MinHeight) {
      //   newTextAreaHeight = TextAreaWrap.MinHeight;
      // }

      // 修改发送框高度
      rTextareaWrap.style.maxHeight = newTextAreaHeight + 'px';
      // 修改光标为可移动
      rResizeLine.style.cursor = 'ns-resize';

      // 更新鼠标最后移动的位置（Y轴）
      that.dragState.endMouseTop = event.clientY;
    }
    function handleMouseUp(event) {
      // 移除鼠标移动事件
      document.removeEventListener('mousemove', handleMouseMove);
      // 移除鼠标放开事件
      document.removeEventListener('mouseup', handleMouseUp);
      // 允许用户选择网页中文字
      document.onselectstart = null;
      // 允许用户拖动元素
      document.ondragstart = null;
    }
    wrapper.appendChild(outside_container);
    inside.addEventListener("paste", (event) => this.insideInput(event, 'paste'));
    inside.addEventListener("input", (event) => this.insideInput(event, 'input'));
    inside.addEventListener("keydown", (event) => this.insideInput(event, 'keydown'));
    inside.addEventListener('compositionstart', (event) => this.handlerComposition(event, 'input'));
    inside.addEventListener('compositionend', (event) => this.handlerComposition(event, 'input'))
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
      languageOptionScroll = this.make('div', 'code-plus-language-scroll'),
      languageOptionContainer = this.make('div'),
      copy = this.make('div', 'code-plus-copy'),
      copyInfo = this.make('div', ['code-plus-copy-info', 'hidden']),
      svg = this.make('span'),
      input = this.make('input', ['code-plus-input']),

      svgWrapper = this.make('div', [this.CSS.svgWrapper]);

    svgWrapper.innerHTML = copysvg;

    input.value = '';
    input.placeholder = '搜索语言';

    this.nodes.input = input;

    let type = 'mouse'
    copy.addEventListener('mouseenter', (ev) => {
      if (copyInfo.classList.contains('hidden') && type === 'mouse') {
        copyInfo.classList.remove('hidden');
        copyInfo.classList.add('visible');
      }
    })

    copy.addEventListener('mouseleave', () => {
      if (copyInfo.classList.contains('visible')) {
        copyInfo.classList.remove('visible');
        copyInfo.classList.add('hidden')
      }

      type = 'mouse';
    })


    copyInfo.textContent = '点击复制'
    languageOptions.appendChild(input);

    let arr = []
    input.addEventListener('input', (event) => {
      if (event.target.value) {
        arr = this.languages.filter(item => {
          var reg = new RegExp(event.target.value, "gi");
          return item.match(reg)
        })
      } else {
        arr = this.languages;
      }


      const fragment = document.createDocumentFragment();
      for (const language of arr) {
        const el = this.make('div', 'code-plus-language-option');
        el.textContent = language;
        fragment.appendChild(el)
      }

      while (languageOptionContainer.firstChild) {
        languageOptionContainer.removeChild(languageOptionContainer.firstChild);
      }

      languageOptionContainer.appendChild(fragment)

    })
    this.nodes.languageOptionContainer = languageOptionContainer;
    languageOptionScroll.appendChild(languageOptionContainer);
    languageOptions.appendChild(languageOptionScroll);
    languageOutside.appendChild(languageOptions)
    this.nodes.languageOutside = languageOutside;
    this.nodes.languageOptions = languageOptions;
    languageOutside.addEventListener('click', (event) => {
      if (languageOptions.contains(event.target)) return;
      if (document.body.contains(languageOutside)) {
        document.body.removeChild(languageOutside);
      }
    })




    languageText.textContent = this.data.language;
    this.nodes.languageText = languageText;
    languageItem.appendChild(languageText);
    svg.innerHTML = select;
    languageItem.appendChild(svg);

    const fragment = document.createDocumentFragment();

    for (const language of this.languages) {
      const el = this.make('div', 'code-plus-language-option');
      el.textContent = language;
      fragment.appendChild(el)
    }

    languageOptionContainer.appendChild(fragment);
    languageOptionContainer.addEventListener('click', (event) => {
      const text = event.target.textContent;

      if (text && text !== '纯文本') {
        const html = this.generateHtml(text);
        this.nodes.languageText.textContent = text;
        this.nodes.div.innerHTML = html;
      } else {
        this.nodes.languageText.textContent = text;
        this.nodes.div.textContent = this.nodes.div.textContent;
      }

      this.data.language = text;

      if (document.body.contains(this.nodes.languageOutside)) {
        document.body.removeChild(this.nodes.languageOutside);
      }

      event.preventDefault();
      event.stopPropagation();
    })



    languageMenu.appendChild(languageItem);
    languageMenu.addEventListener('click', (event) => this.languageMenuClick(event))

    selectLangueMenu.appendChild(languageMenu);

    copy.appendChild(svgWrapper);


    selectLangueMenu.appendChild(copy);
    selectLangueMenu.appendChild(copyInfo)

    let bool = true;
    copy.addEventListener("click", () => {

      if (bool) {
        bool = false;
        type = 'click';

        let range = document.createRange();
        range.selectNode(this.nodes.div); // 创建 Range 对象并选中整个区域
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try {
          document.execCommand('copy'); // 执行复制命令
          console.log('复制成功');
        } catch (e) {
          console.log('复制失败');
        }
        selection.removeAllRanges();



        svgWrapper.innerHTML = successcopy;
        copyInfo.textContent = '复制成功';

        if (copyInfo.classList.contains('hidden') && type === 'click') {
          copyInfo.classList.remove('hidden');
          copyInfo.classList.add('visible');
        }


        var timer = setTimeout(() => {
          if (copyInfo.classList.contains('visible')) {
            console.log('>>>>>>>>>>>>>>>>>')
            copyInfo.classList.remove('visible');
            copyInfo.classList.add('hidden');
            clearTimeout(timer);
          }

          svgWrapper.innerHTML = copysvg;
          bool = true;

        }, 1000)
      }

    })

    copyInfo.addEventListener('transitionend', (ev) => {
      if (ev.target.classList.contains('hidden')) {
        copyInfo.textContent = '点击复制';
      }
    })

    codePlusLibraryMenu.appendChild(selectLangueMenu);

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
      lineNumber: Math.floor(codeWrapper.querySelector('.cdx-input').clientHeight),
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
    this.positioningHandle(selection, range, this.nodes.div.childNodes[0], rangeStartOffset + value.length);
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

  positioningHandle(selection, range, dom, len) {
    if (len === 0) {
      len = range.startOffset;
    }
    range.setStart(dom, len);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.range = range;
    this.selection = selection;
  }

  // keyPressHandler(event) {
  //   event.preventDefault();
  //   this.textInit(event, this.isEnterPress ? '\n' : '\n\n');
  //   this.isEnterPress = true;
  // }


  generateHtml(text) {
    return Prism.highlight(this.nodes.div ? this.nodes.div.textContent : this.data.code, Prism.languages[text.toLocaleLowerCase()], text.toLocaleLowerCase())
  }

  handlerComposition(event, type) {
    this.isInput = !event.isTrusted;
    if (this.isInput && event.data) {
      this.insideInput(event, type);
    }
  }

  insideInput(event, type) {
    if (!this.isInput) return
    const endContainer = selection.getEndContainer();
    let inset = ''
    if (type === 'keydown' && event.keyCode !== 9) {
      return
    }

    if (type === 'paste') {
      event.preventDefault();
      event.stopPropagation();
      const clipboard = event.clipboardData || window.clipboardData
      if (clipboard) {
        selection.deleteContents()
        inset = clipboard.getData("text/plain").toString().replace(/\r\n/g, '\n')
      } else {
        alert('Paste is not supported, please enter it manually!')
        return
      }
    }

    getFrontOffset(this.nodes.div, endContainer, inset, (totalOffset, textContext) => {
      if (this.nodes.languageText.textContent === '纯文本') {
        this.nodes.div.textContent = textContext;
      } else {
        const realContent = Prism.highlight(textContext, Prism.languages[this.data.language.toLocaleLowerCase()], this.data.language.toLocaleLowerCase());
        this.nodes.div.innerHTML = realContent;

      }
      getRealDomAndOffset(this.nodes.div, totalOffset, (el, i) => {
        selection.setCursorOffset(el, i)
      })
    })


    // 是否需要展示拖条
    if (!this.nodes.outside_container.contains(this.nodes.dragBack) && this.nodes.div.getBoundingClientRect().height > this.TextAreaWrap.MinHeight) {
      this.nodes.outside_container.appendChild(this.nodes.dragBack)
    } else if (this.nodes.div.getBoundingClientRect().height <= this.TextAreaWrap.MinHeight && this.nodes.outside_container.contains(this.nodes.dragBack)) {
      this.nodes.outside_container.removeChild(this.nodes.dragBack);
    }

    this.TextAreaWrap.MaxHeight = this.nodes.div.getBoundingClientRect().height;
  }

  languageMenuClick(event) {
    const { bottom, left } = event.target.getBoundingClientRect();
    if (!document.body.contains(this.nodes.languageOutside)) {
      document.body.appendChild(this.nodes.languageOutside);
    }
    this.nodes.languageOptions.style.top = `${(bottom)}px`;
    this.nodes.languageOptions.style.left = `${left}px`;

    this.nodes.input.focus();
    // 重置数据
    this.nodes.input.value = '';
    const fragment = document.createDocumentFragment();
    for (const language of this.languages) {
      const el = this.make('div', 'code-plus-language-option');
      el.textContent = language;
      fragment.appendChild(el)
    }

    while (this.nodes.languageOptionContainer.firstChild) {
      this.nodes.languageOptionContainer.removeChild(this.nodes.languageOptionContainer.firstChild);
    }

    this.nodes.languageOptionContainer.appendChild(fragment)
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