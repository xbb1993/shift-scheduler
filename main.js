const SHIFT = {D:'值班', W:'白班', N:'下夜', R:'休息'};
const DEFAULT_OLDS = ['杨梨云','鲜双双','赵婷'];
const DEFAULT_NEWS = ['吴美泽','李龙'];

let state = {
  month:'',
  days:[],
  holidays:new Set(),
  dutyDates:new Set(),
  olds:[...DEFAULT_OLDS],
  news:[...DEFAULT_NEWS],
  firstDuty:'',
  firstDay:{},
  result:null,
  modified:false
};

const $ = id => document.getElementById(id);

function pad(n){
  return String(n).padStart(2,'0');
}

function keyDate(y,m,d){
  return `${y}-${pad(m)}-${pad(d)}`;
}

function fmtDate(ds){
  const d = new Date(ds+'T00:00:00');
  return `${d.getMonth()+1}/${d.getDate()} 周${['日','一','二','三','四','五','六'][d.getDay()]}`;
}

function daysInMonth(y,m){
  return new Date(y,m,0).getDate();
}

function weekday(ds){
  return new Date(ds+'T00:00:00').getDay();
}

function allPeople(){
  return [...state.olds,...state.news];
}

function isOld(name){
  return state.olds.includes(name);
}

function showStep(n){
  for(let i=1;i<=5;i++){
    $(`step${i}`).classList.toggle('hidden',i!==n);

    document
      .querySelector(`.step[data-step="${i}"]`)
      .classList.toggle('active',i===n);

    document
      .querySelector(`.step[data-step="${i}"]`)
      .classList.toggle('done',i<n);
  }
}

function initMonth(){
  const now = new Date();

  const y = now.getFullYear();
  const m = now.getMonth()+1;

  $('monthInput').value =
    `${y}-${pad(m)}`;
}

function buildDays(){
  const [y,m] =
    state.month.split('-').map(Number);

  const n = daysInMonth(y,m);

  state.days = [];

  for(let d=1;d<=n;d++){
    state.days.push(
      keyDate(y,m,d)
    );
  }
}

function initHolidays(){
  state.holidays =
    new Set(
      state.days.filter(
        ds => [0,6].includes(weekday(ds))
      )
    );
}

function initDutyDates(){
  state.dutyDates =
    new Set(
      state.days.filter(
        ds => [1,2,3,5,6].includes(weekday(ds))
      )
    );
}

function renderHolidayCalendar(){

  const c = $('holidayCalendar');

  c.innerHTML = '';

  const [y,m] =
    state.month.split('-').map(Number);

  const first =
    new Date(y,m-1,1).getDay();

  ['日','一','二','三','四','五','六'].forEach(x => {

    const e =
      document.createElement('div');

    e.className = 'dow';
    e.textContent = x;

    c.appendChild(e);
  });

  for(let i=0;i<first;i++){

    const e =
      document.createElement('div');

    e.className = 'day blank';

    c.appendChild(e);
  }

  state.days.forEach(ds => {

    const d =
      new Date(ds+'T00:00:00').getDate();

    const e =
      document.createElement('div');

    e.className =
      'day' +
      (
        state.holidays.has(ds)
          ? ' holiday'
          : ''
      );

    e.innerHTML =
      `<div class="num">${d}</div>` +
      `<small>${
        state.holidays.has(ds)
          ? '法定休息'
          : '工作日'
      }</small>`;

    e.onclick = () => {

      if(state.holidays.has(ds)){
        state.holidays.delete(ds);
      }else{
        state.holidays.add(ds);
      }

      renderHolidayCalendar();
    };

    c.appendChild(e);
  });

  $('holidayCount').textContent =
    `共 ${state.holidays.size} 天法定休息日`;
}

function renderDutyCalendar(){

  const c = $('dutyCalendar');

  c.innerHTML = '';

  const [y,m] =
    state.month.split('-').map(Number);

  const first =
    new Date(y,m-1,1).getDay();

  ['日','一','二','三','四','五','六'].forEach(x => {

    const e =
      document.createElement('div');

    e.className = 'dow';
    e.textContent = x;

    c.appendChild(e);
  });

  for(let i=0;i<first;i++){

    const e =
      document.createElement('div');

    e.className =
      'day blank';

    c.appendChild(e);
  }

  state.days.forEach(ds => {

    const d =
      new Date(ds+'T00:00:00').getDate();

    const duty =
      state.dutyDates.has(ds);

    const holiday =
      state.holidays.has(ds);

    const e =
      document.createElement('div');

    e.className =
      'day' +
      (holiday ? ' holiday' : '') +
      (duty ? ' duty-date' : '');

    e.innerHTML =
      `<div class="num">${d}</div>` +
      `<small>${
        duty
          ? '值班日'
          : '非值班日'
      }${
        holiday
          ? ' · 法定休息'
          : ''
      }</small>`;

    e.onclick = () => {

      if(state.dutyDates.has(ds)){
        state.dutyDates.delete(ds);
      }else{
        state.dutyDates.add(ds);
      }

      renderDutyCalendar();
    };

    c.appendChild(e);
  });

  $('dutyDateCount').textContent =
    `共 ${state.dutyDates.size} 个值班日`;
}

function renderPeople(){

  renderPeopleGroup(
    'oldList',
    'olds'
  );

  renderPeopleGroup(
    'newList',
    'news'
  );

  const names = allPeople();

  if(!names.includes(state.firstDuty)){
    state.firstDuty =
      names[0] || '';
  }

  $('firstDuty').innerHTML =
    names
      .map(
        n =>
          `<option value="${esc(n)}">${esc(n)}</option>`
      )
      .join('');

  $('firstDuty').value =
    state.firstDuty;

  $('firstDuty').onchange = e => {

    state.firstDuty =
      e.target.value;

    renderFirstDay();

    updatePrecheck();
  };

  renderFirstDay();
}

function renderPeopleGroup(
  container,
  key
){

  const c = $(container);

  c.innerHTML = '';

  state[key].forEach(
    (name,i) => {

      const row =
        document.createElement('div');

      row.className =
        'person-row';

      row.innerHTML =
        `<span class="tag">${i+1}.</span>` +
        `<input type="text" value="${esc(name)}">` +
        `<button class="btn danger">删除</button>`;

      const inp =
        row.querySelector('input');

      inp.onchange = () => {

        state[key][i] =
          inp.value.trim() ||
          `未命名${i+1}`;

        renderPeople();

        updatePrecheck();
      };

      row
        .querySelector('button')
        .onclick = () => {

          state[key].splice(i,1);

          renderPeople();

          updatePrecheck();
        };

      c.appendChild(row);
    }
  );
}

function esc(s){
  return String(s).replace(
    /[&<>"]/g,
    m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;'
    }[m])
  );
}

function addPerson(key){

  state[key].push(
    key === 'olds'
      ? `老鸟${state[key].length+1}`
      : `新人${state[key].length+1}`
  );

  renderPeople();

  updatePrecheck();
}

/*
 * 1号班次配置：
 *
 * 1. 1号是值班日：
 *    - firstDuty 自动固定为 D
 *    - firstDuty 不显示在下面
 *    - 其他人只能选择 W/N/R
 *
 * 2. 1号不是值班日：
 *    - 所有人都显示
 *    - 所有人只能选择 W/N/R
 *
 * 特别注意：
 * 这里的人工输入不参与规则校验。
 */
function renderFirstDay(){

  const body =
    $('firstDayBody');

  body.innerHTML = '';

  const names =
    allPeople();

  const first =
    state.days[0];

  const firstIsDuty =
    first &&
    state.dutyDates.has(first);

  names.forEach(n => {

    if(
      firstIsDuty &&
      n === state.firstDuty
    ){
      /*
       * firstDuty 是人工指定的
       * 当月第一个值班日值班人员。
       *
       * 如果1号就是值班日，
       * 则1号该人员固定为D。
       */
      state.firstDay[n] = 'D';
      return;
    }

    const tr =
      document.createElement('tr');

    tr.innerHTML =
      `<td>${esc(n)}</td>` +
      `<td>` +
        `<select data-name="${esc(n)}">` +
          `<option value="">请选择</option>` +
          `<option value="W">白班</option>` +
          `<option value="N">下夜</option>` +
          `<option value="R">休息</option>` +
        `</select>` +
      `</td>`;

    const s =
      tr.querySelector('select');

    s.value =
      state.firstDay[n] || '';

    s.onchange = () => {

      state.firstDay[n] =
        s.value;

      updatePrecheck();
    };

    body.appendChild(tr);
  });

  /*
   * 1号不是值班日：
   * 手工输入本身永远不会存在D。
   */
}

function syncFirstDay(){

  renderFirstDay();

  const s =
    $('firstDuty');

  if(s){
    s.value =
      state.firstDuty;
  }
}

/*
 * 注意：
 * 本函数只检查“配置是否填写完整”，
 * 不检查人工填入的班次是否符合任何排班规则。
 */
function updatePrecheck(){

  const names =
    allPeople();

  const msgs = [];

  if(names.length === 0){
    msgs.push([
      'error',
      '至少需要1名人员。'
    ]);
  }

  if(
    !state.firstDuty ||
    !names.includes(state.firstDuty)
  ){
    msgs.push([
      'error',
      '请先选择当月第一个值班日的值班人员。'
    ]);
  }

  const first =
    state.days[0];

  const firstIsDuty =
    first &&
    state.dutyDates.has(first);

  /*
   * 只有“没有填写”才提示。
   * 不检查填写内容是否违反规则。
   */
  const manualPeople =
    firstIsDuty
      ? names.filter(
          n => n !== state.firstDuty
        )
      : names;

  manualPeople.forEach(n => {

    if(!state.firstDay[n]){
      msgs.push([
        'warn',
        `请填写${n}的1号班次。`
      ]);
    }
  });

  $('precheck').innerHTML =
    msgs.length
      ? msgs
          .map(
            x =>
              `<div class="alert ${x[0]}">${x[1]}</div>`
          )
          .join('')
      : '<div class="alert info">配置检查通过后即可生成。</div>';

  return !msgs.some(
    x => x[0] === 'error'
  );
}

function buildDutySequence(){

  const old =
    state.olds;

  const nw =
    state.news;

  if(!old.length && !nw.length){
    return [];
  }

  const rounds = [];

  const target =
    state.days.filter(
      d => state.dutyDates.has(d)
    ).length;

  if(!target){
    return [];
  }

  /*
   * 例如：
   * A B C
   * D E
   *
   * A B C D
   * A B C E
   * A B C D
   * A B C E
   */
  const maxRounds =
    Math.max(
      2,
      target + 2
    );

  for(
    let r=0;
    r<maxRounds;
    r++
  ){

    old.forEach(
      x => rounds.push(x)
    );

    if(nw.length){
      rounds.push(
        nw[r % nw.length]
      );
    }
  }

  let start =
    rounds.indexOf(
      state.firstDuty
    );

  if(start < 0){
    start = 0;
  }

  const seq = [];

  for(
    let i=0;
    i<target;
    i++
  ){
    seq.push(
      rounds[
        (start+i) %
        rounds.length
      ]
    );
  }

  return seq;
}

/*
 * 生成“算法固定班次”。
 *
 * 这里把人工1号班次也作为固定输入，
 * 但后续不会因为人工1号班次违反规则而拒绝。
 */
function fixedByDuty(){

  const dutyDays =
    state.days.filter(
      d => state.dutyDates.has(d)
    );

  const seq =
    buildDutySequence();

  const fixed = {};

  state.days.forEach(ds => {
    fixed[ds] = {};
  });

  dutyDays.forEach(
    (ds,i) => {

      const p = seq[i];

      if(!p){
        return;
      }

      fixed[ds][p] = 'D';

      const idx =
        state.days.indexOf(ds);

      if(
        idx+1 < state.days.length &&
        !fixed[state.days[idx+1]][p]
      ){
        fixed[state.days[idx+1]][p] =
          'N';
      }

      if(
        idx+2 < state.days.length &&
        !fixed[state.days[idx+2]][p]
      ){
        fixed[state.days[idx+2]][p] =
          'R';
      }
    }
  );

  const first =
    state.days[0];

  const firstIsDuty =
    first &&
    state.dutyDates.has(first);

  /*
   * 人工输入的1号班次优先。
   *
   * 1号是值班日时：
   * firstDuty = D。
   *
   * 其他人工输入作为强制结果。
   */
  allPeople().forEach(p => {

    if(
      firstIsDuty &&
      p === state.firstDuty
    ){

      fixed[first][p] = 'D';

    }else if(
      state.firstDay[p]
    ){

      fixed[first][p] =
        state.firstDay[p];
    }
  });

  /*
   * 根据1号输入向后推导自然班次。
   *
   * 这里仍然保留“D -> N -> R”的自然推导。
   * 但不会因为人工输入本身不合理而报错。
   */
  allPeople().forEach(p => {

    const x =
      fixed[first][p];

    if(x === 'D'){

      if(
        state.days[1] &&
        !fixed[state.days[1]][p]
      ){
        fixed[state.days[1]][p] =
          'N';
      }

      if(
        state.days[2] &&
        !fixed[state.days[2]][p]
      ){
        fixed[state.days[2]][p] =
          'R';
      }

    }else if(x === 'N'){

      if(
        state.days[1] &&
        !fixed[state.days[1]][p]
      ){
        fixed[state.days[1]][p] =
          'R';
      }
    }
  });

  return fixed;
}

/*
 * 重要变化：
 *
 * 删除原来的 validateStatic()。
 *
 * 原来的校验会检查：
 * - 人工1号是否与firstDuty一致
 * - 人工1号是否产生多个值班
 * - 人工休息是否超过法定休息日
 * - 固定班次之间是否冲突
 *
 * 现在这些都不再作为生成前置条件。
 */
function validateStatic(){
  return [];
}

/*
 * 统计“人工固定的休息日”。
 *
 * 对算法而言：
 * 如果某人1号人工填写了R，
 * 那么这1天已经占用了一个休息名额。
 *
 * 但是如果人工输入导致休息数超过H，
 * 仍然不报错。
 *
 * 这种情况下后续算法不再强制增加自动休息，
 * 最终休息总数可以 > H。
 */
function getManualRestCount(fixed, person){

  const first =
    state.days[0];

  if(
    first &&
    fixed[first] &&
    fixed[first][person] === 'R'
  ){
    return 1;
  }

  return 0;
}

/*
 * 排班求解器
 *
 * 核心思想：
 *
 * 1. 人工输入的班次绝对不修改。
 * 2. 人工输入的班次绝对不因为违反规则而报错。
 * 3. 自动部分只负责安排剩余人员。
 * 4. 每个人如果人工已经休息1天，
 *    自动休息目标就减少1天。
 * 5. 如果人工休息已经超过H，
 *    自动部分不再强制休息。
 */
function solve(){

  const names =
    allPeople();

  const P =
    names.length;

  const H =
    state.holidays.size;

  if(P === 0){
    throw new Error('没有人员');
  }

  const fixed =
    fixedByDuty();

  /*
   * 每个人允许的“自动休息上限”。
   */
  const manualRest =
    Array(P).fill(0);

  const restTarget =
    Array(P).fill(0);

  for(let i=0;i<P;i++){

    manualRest[i] =
      getManualRestCount(
        fixed,
        names[i]
      );

    restTarget[i] =
      Math.max(
        0,
        H - manualRest[i]
      );
  }

  /*
   * 状态空间按照每个人“自动休息次数”
   * 进行编码。
   */
  const rad =
    restTarget.map(x => x+1);

  const mult =
    Array(P).fill(1);

  for(let i=1;i<P;i++){
    mult[i] =
      mult[i-1] * rad[i-1];
  }

  const totalStates =
    P === 0
      ? 1
      : mult[P-1] * rad[P-1];

  if(totalStates > 3000000){
    throw new Error(
      '人员数量过多或法定休息日过多，当前浏览器不建议计算。'
    );
  }

  let cur =
    new Map([
      [
        0,
        {
          score:0,
          path:null,
          mask:null
        }
      ]
    ]);

  /*
   * masks：
   * 0 = 自动白班
   * 1 = 自动休息
   *
   * 固定班次不会进入mask。
   */
  for(
    let di=0;
    di<state.days.length;
    di++
  ){

    const ds =
      state.days[di];

    const wd =
      weekday(ds);

    const holiday =
      state.holidays.has(ds);

    /*
     * 白班下限：
     *
     * 周一、二、三、五：
     * 至少2个。
     *
     * 周四：
     * 至少1个。
     *
     * 周六、周日：
     * 默认不强制白班。
     *
     * 法定休息日：
     * 老鸟值班 -> 可以没有白班
     * 新人值班 -> 至少1名老鸟白班
     */
    let minWhite;

    const dutyName =
      Object.entries(
        fixed[ds] || {}
      ).find(
        ([,v]) => v === 'D'
      )?.[0];

    if(holiday){

      if(
        dutyName &&
        isOld(dutyName)
      ){
        minWhite = 0;
      }else{
        minWhite = 1;
      }

    }else if(
      [1,2,3,5].includes(wd)
    ){

      minWhite = 2;

    }else if(wd === 4){

      minWhite = 1;

    }else{

      minWhite = 0;
    }

    const opts = [];

    function rec(
      i,
      adds,
      white,
      oldWhite
    ){

      if(i === P){

        if(white < minWhite){
          return;
        }

        /*
         * 法定休息日 + 新人值班：
         * 至少1名老鸟白班。
         */
        if(
          holiday &&
          dutyName &&
          !isOld(dutyName) &&
          oldWhite < 1
        ){
          return;
        }

        opts.push({
          adds:adds.slice(),
          white
        });

        return;
      }

      const fx =
        fixed[ds] &&
        fixed[ds][names[i]];

      if(fx){

        /*
         * 固定班次：
         *
         * R = 已占用1个休息
         * W / D / N = 不增加自动休息
         *
         * 注意：
         * 这里不会检查固定班次是否违反规则。
         */
        adds[i] =
          fx === 'R'
            ? 1
            : 0;

        rec(
          i+1,
          adds,
          white +
            (fx === 'W' ? 1 : 0),
          oldWhite +
            (
              fx === 'W' &&
              isOld(names[i])
                ? 1
                : 0
            )
        );

        return;
      }

      /*
       * 当前人员没有固定班次。
       *
       * 选择白班：
       * 不增加自动休息。
       */
      adds[i] = 0;

      rec(
        i+1,
        adds,
        white+1,
        oldWhite +
          (
            isOld(names[i])
              ? 1
              : 0
          )
      );

      /*
       * 选择休息：
       *
       * 只有当这个人还没有达到自己的
       * 自动休息目标时才允许。
       */
      const currentCode = 0;

      adds[i] = 1;

      rec(
        i+1,
        adds,
        white,
        oldWhite
      );
    }

    rec(
      0,
      Array(P).fill(0),
      0,
      0
    );

    const next =
      new Map();

    for(const [code,entry] of cur){

      for(const o of opts){

        let nc =
          code;

        let ok = true;

        for(let i=0;i<P;i++){

          /*
           * 当前自动休息数。
           */
          const c =
            Math.floor(
              nc / mult[i]
            ) %
            rad[i];

          /*
           * 固定R / 自动R都会在adds中表现为1。
           *
           * 固定R虽然已经属于人工/自动固定，
           * 但不能再次增加编码。
           */
          if(o.adds[i]){

            /*
             * 计算本人的自动目标。
             *
             * 如果该日期是固定R，
             * 它不应该再次计入自动restTarget。
             *
             * 因此这里需要判断：
             */
            const fx =
              fixed[ds] &&
              fixed[ds][names[i]];

            if(fx === 'R'){
              continue;
            }

            const n =
              c + 1;

            if(
              n > restTarget[i]
            ){
              ok = false;
              break;
            }

            nc += mult[i];

          }
        }

        if(!ok){
          continue;
        }

        let hrest = 0;
        let tw = 0;
        let mw = 0;

        for(let i=0;i<P;i++){

          const fx =
            fixed[ds] &&
            fixed[ds][names[i]];

          const isRest =
            fx === 'R' ||
            (
              !fx &&
              o.adds[i] === 1
            );

          if(isRest){

            if(holiday){
              hrest++;
            }

          }else{

            if(
              [1,2,5].includes(wd) &&
              (
                fx === 'W' ||
                (!fx && o.adds[i] === 0)
              )
            ){
              tw++;
            }

            if(
              [3,4].includes(wd) &&
              (
                fx === 'W' ||
                (!fx && o.adds[i] === 0)
              )
            ){
              mw++;
            }
          }
        }

        /*
         * 优先级：
         *
         * 1. 法定休息日休息
         * 2. 周一/二/五白班
         * 3. 周三/四白班
         */
        const score =
          entry.score +
          hrest * 100000 +
          tw * 100 +
          mw;

        const old =
          next.get(nc);

        if(
          !old ||
          score > old.score
        ){

          next.set(
            nc,
            {
              score,
              path:entry,
              mask:o.adds.slice()
            }
          );
        }
      }
    }

    if(!next.size){

      /*
       * 注意：
       *
       * 不再因为人工1号班次本身违反规则而
       * 报错。
       *
       * 这里只代表：
       * 在保留人工结果的情况下，
       * 剩余自动部分无法满足可执行约束。
       */
      throw new Error(
        `${fmtDate(ds)}附近无法完成自动排班。请适当调整值班日期或自动排班条件。`
      );
    }

    cur = next;
  }

  /*
   * 最终目标不是统一H，
   * 而是每个人各自的自动休息目标。
   */
  let targetCode = 0;

  for(let i=0;i<P;i++){
    targetCode +=
      restTarget[i] *
      mult[i];
  }

  const end =
    cur.get(targetCode);

  if(!end){

    throw new Error(
      '在保留人工填写班次的情况下，找不到完整的自动排班结果。'
    );
  }

  const byDay =
    Array(state.days.length);

  let node =
    end;

  for(
    let di=state.days.length-1;
    di>=0;
    di--
  ){

    byDay[di] =
      node.mask;

    node =
      node.path;
  }

  const result = {};

  state.days.forEach(
    (ds,di) => {

      result[ds] = {};

      for(let i=0;i<P;i++){

        const fx =
          fixed[ds][names[i]];

        result[ds][names[i]] =
          fx ||
          (
            byDay[di][i] === 1
              ? 'R'
              : 'W'
          );
      }
    }
  );

  return result;
}

function generate(){

  if(!updatePrecheck()){
    return;
  }

  const names =
    allPeople();

  const dup =
    names.filter(
      (n,i) =>
        names.indexOf(n) !== i
    );

  if(dup.length){

    $('precheck').innerHTML =
      `<div class="alert error">人员姓名不能重复：${esc([...new Set(dup)].join('、'))}</div>`;

    return;
  }

  try{

    state.result =
      solve();

    state.modified = false;

    renderResult();

    showStep(5);

  }catch(e){

    $('precheck').innerHTML =
      `<div class="alert error">${esc(e.message)}</div>`;
  }
}

function updateSummary(){

  const names =
    allPeople();

  const res =
    state.result;

  const sm =
    $('summary');

  if(!sm || !res){
    return;
  }

  sm.innerHTML = '';

  names.forEach(p => {

    let r = 0;
    let d = 0;
    let n = 0;
    let w = 0;

    state.days.forEach(ds => {

      const x =
        res[ds][p];

      if(x === 'R') r++;
      else if(x === 'D') d++;
      else if(x === 'N') n++;
      else if(x === 'W') w++;
    });

    const e =
      document.createElement('div');

    e.className =
      'stat';

    e.innerHTML =
      `<b>${esc(p)}</b>` +
      `<span>值班 ${d} · 白班 ${w} · 下夜 ${n} · 休息 ${r}</span>`;

    sm.appendChild(e);
  });
}

function ensureEditDialog(){

  if($('editOverlay')){
    return;
  }

  const overlay =
    document.createElement('div');

  overlay.id =
    'editOverlay';

  overlay.className =
    'hidden';

  overlay.innerHTML = `
    <div class="edit-backdrop"></div>

    <div class="edit-dialog">

      <div
        class="edit-title"
        id="editTitle"
      >调整班次</div>

      <div
        class="edit-current"
        id="editCurrent"
      ></div>

      <div class="edit-options">

        <button
          type="button"
          class="edit-shift-btn shift-D"
          data-shift="D"
        >值班</button>

        <button
          type="button"
          class="edit-shift-btn shift-W"
          data-shift="W"
        >白班</button>

        <button
          type="button"
          class="edit-shift-btn shift-N"
          data-shift="N"
        >下夜</button>

        <button
          type="button"
          class="edit-shift-btn shift-R"
          data-shift="R"
        >休息</button>

      </div>

      <button
        type="button"
        class="edit-cancel"
      >取消</button>

    </div>
  `;

  document.body.appendChild(overlay);

  overlay
    .querySelector('.edit-backdrop')
    .onclick =
      closeShiftEditor;

  overlay
    .querySelector('.edit-cancel')
    .onclick =
      closeShiftEditor;

  overlay
    .querySelectorAll('.edit-shift-btn')
    .forEach(btn => {

      btn.onclick = () => {

        applyShift(
          btn.dataset.shift
        );
      };
    });
}

function openShiftEditor(
  ds,
  person
){

  ensureEditDialog();

  const overlay =
    $('editOverlay');

  overlay.dataset.date =
    ds;

  overlay.dataset.person =
    encodeURIComponent(person);

  const current =
    state.result?.[ds]?.[person] || '';

  $('editTitle').textContent =
    `${fmtDate(ds)} · ${person}`;

  $('editCurrent').textContent =
    `当前班次：${SHIFT[current] || '未设置'}`;

  overlay.classList.remove(
    'hidden'
  );
}

function closeShiftEditor(){

  const overlay =
    $('editOverlay');

  if(!overlay){
    return;
  }

  overlay.classList.add(
    'hidden'
  );
}

/*
 * 人工修改：
 *
 * 不进行任何规则校验。
 *
 * 不重新调用solve()。
 * 不验证：
 * - 值班顺序
 * - 值班后的下夜/休息
 * - 白班最低人数
 * - 老鸟/新人规则
 * - 法定休息日
 * - 每人休息天数
 *
 * 只更新最终结果。
 */
function applyShift(shift){

  const overlay =
    $('editOverlay');

  if(!overlay){
    return;
  }

  const ds =
    overlay.dataset.date;

  const person =
    decodeURIComponent(
      overlay.dataset.person || ''
    );

  if(!ds || !person){
    return;
  }

  if(!SHIFT[shift]){
    return;
  }

  state.result[ds][person] =
    shift;

  state.modified = true;

  closeShiftEditor();

  /*
   * 重新渲染：
   * - 排班表
   * - 人员统计
   */
  renderResult();
}

function renderResult(){

  const names =
    allPeople();

  const res =
    state.result;

  if(!res){
    return;
  }

  $('resultHint').textContent =
    `${state.month} · ${state.days.length}天 · 法定休息日${state.holidays.size}天 · 值班日${state.dutyDates.size}天`;

  $('resultAlert').innerHTML =
    state.modified
      ? '<div class="alert warn">排班结果包含人工调整。当前下载的 Excel/CSV 将使用调整后的结果。</div>'
      : '<div class="alert ok">排班生成成功。点击任意班次单元格可以人工调整。</div>';

  /*
   * 每次renderResult都重新统计。
   * 因此人工调整后这里会实时变化。
   */
  updateSummary();

  const t =
    $('resultTable');

  let h =
    '<thead><tr><th>人员</th>';

  state.days.forEach(ds => {

    h +=
      `<th>${fmtDate(ds)}</th>`;
  });

  h +=
    '</tr></thead><tbody>';

  names.forEach(p => {

    h +=
      `<tr><td><b>${esc(p)}</b></td>`;

    state.days.forEach(ds => {

      const x =
        res[ds][p];

      h +=
        `<td
          class="result-cell ${
            x==='D'
              ? 'cell-duty'
              : x==='N'
                ? 'cell-night'
                : x==='R'
                  ? 'cell-rest'
                  : 'cell-white'
          }"
          data-date="${ds}"
          data-person="${esc(p)}"
          title="点击调整班次"
        >${SHIFT[x]}</td>`;
    });

    h +=
      '</tr>';
  });

  h +=
    '</tbody>';

  t.innerHTML =
    h;

  t.querySelectorAll(
    '.result-cell'
  ).forEach(cell => {

    cell.onclick = () => {

      openShiftEditor(
        cell.dataset.date,
        cell.dataset.person
      );
    };
  });
}

function resultCSV(){

  const names =
    allPeople();

  let lines = [
    ['日期',...names].join(',')
  ];

  state.days.forEach(ds => {

    lines.push(
      [
        fmtDate(ds),
        ...names.map(
          p =>
            SHIFT[
              state.result[ds][p]
            ]
        )
      ]
      .map(
        x =>
          '"' +
          String(x).replace(
            /"/g,
            '""'
          ) +
          '"'
      )
      .join(',')
    );
  });

  return (
    '\ufeff' +
    lines.join('\n')
  );
}

function xmlEsc(v){

  return String(v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

const ZIP_CRC_TABLE =
  (() => {

    const t =
      new Uint32Array(256);

    for(
      let n=0;
      n<256;
      n++
    ){

      let c = n;

      for(
        let k=0;
        k<8;
        k++
      ){

        c =
          (c & 1)
            ? (
                0xEDB88320 ^
                (c >>> 1)
              )
            : (c >>> 1);
      }

      t[n] =
        c >>> 0;
    }

    return t;

  })();

function crc32(bytes){

  let c =
    0xFFFFFFFF;

  for(
    let i=0;
    i<bytes.length;
    i++
  ){

    c =
      ZIP_CRC_TABLE[
        (c ^ bytes[i]) & 255
      ] ^
      (c >>> 8);
  }

  return (
    c ^
    0xFFFFFFFF
  ) >>> 0;
}

function u16(v){

  return new Uint8Array([
    v & 255,
    (v >>> 8) & 255
  ]);
}

function u32(v){

  return new Uint8Array([
    v & 255,
    (v >>> 8) & 255,
    (v >>> 16) & 255,
    (v >>> 24) & 255
  ]);
}

function concatBytes(...arrs){

  const n =
    arrs.reduce(
      (s,a) => s+a.length,
      0
    );

  const out =
    new Uint8Array(n);

  let p = 0;

  for(const a of arrs){

    out.set(a,p);

    p += a.length;
  }

  return out;
}

function zipStore(files){

  const enc =
    new TextEncoder();

  const parts = [];
  const central = [];

  let offset = 0;

  for(const f of files){

    const name =
      enc.encode(f.name);

    const data =
      typeof f.data === 'string'
        ? enc.encode(f.data)
        : f.data;

    const crc =
      crc32(data);

    const local =
      concatBytes(

        new Uint8Array([
          0x50,
          0x4b,
          0x03,
          0x04
        ]),

        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),

        u32(crc),
        u32(data.length),
        u32(data.length),

        u16(name.length),
        u16(0),

        name,
        data
      );

    parts.push(local);

    const cent =
      concatBytes(

        new Uint8Array([
          0x50,
          0x4b,
          0x01,
          0x02
        ]),

        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),

        u32(crc),
        u32(data.length),
        u32(data.length),

        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),

        u32(0),
        u32(offset),

        name
      );

    central.push(cent);

    offset +=
      local.length;
  }

  const centralBytes =
    concatBytes(
      ...central
    );

  const end =
    concatBytes(

      new Uint8Array([
        0x50,
        0x4b,
        0x05,
        0x06
      ]),

      u16(0),
      u16(0),

      u16(files.length),
      u16(files.length),

      u32(centralBytes.length),
      u32(offset),

      u16(0)
    );

  return concatBytes(
    ...parts,
    centralBytes,
    end
  );
}

function colName(n){

  let s = '';

  n++;

  while(n){

    const r =
      (n-1) % 26;

    s =
      String.fromCharCode(
        65+r
      ) + s;

    n =
      Math.floor(
        (n-1)/26
      );
  }

  return s;
}

function xlsxCell(
  ref,
  value,
  style=0
){

  return (
    `<c r="${ref}" s="${style}" t="inlineStr">` +
      `<is><t>${xmlEsc(value)}</t></is>` +
    `</c>`
  );
}

function buildXlsx(){

  const names =
    allPeople();

  const days =
    state.days;

  const res =
    state.result;

  const sheetRows = [];

  const headers =
    [
      '人员',
      ...days.map(fmtDate)
    ];

  sheetRows.push(
    `<row r="1" ht="26" customHeight="1">` +
      headers
        .map(
          (v,i) =>
            xlsxCell(
              `${colName(i)}1`,
              v,
              1
            )
        )
        .join('') +
    `</row>`
  );

  names.forEach(
    (p,ri) => {

      const cells = [
        xlsxCell(
          `A${ri+2}`,
          p,
          2
        )
      ];

      days.forEach(
        (ds,di) => {

          const x =
            res[ds][p];

          const style =
            x === 'D'
              ? 3
              : x === 'W'
                ? 4
                : x === 'N'
                  ? 5
                  : 6;

          cells.push(
            xlsxCell(
              `${colName(di+1)}${ri+2}`,
              SHIFT[x],
              style
            )
          );
        }
      );

      sheetRows.push(
        `<row r="${ri+2}" ht="24" customHeight="1">` +
          cells.join('') +
        `</row>`
      );
    }
  );

  const lastRef =
    `${colName(days.length)}${names.length+1}`;

  const sheetXml =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0" showGridLines="0">
      <pane
        xSplit="1"
        ySplit="1"
        topLeftCell="B2"
        activePane="bottomRight"
        state="frozen"
      />
    </sheetView>
  </sheetViews>

  <sheetFormatPr defaultRowHeight="20"/>

  <cols>
    <col
      min="1"
      max="1"
      width="18"
      customWidth="1"
    />

    <col
      min="2"
      max="${days.length+1}"
      width="12"
      customWidth="1"
    />
  </cols>

  <sheetData>
    ${sheetRows.join('')}
  </sheetData>

  <autoFilter
    ref="A1:${lastRef}"
  />

  <pageMargins
    left="0.25"
    right="0.25"
    top="0.5"
    bottom="0.5"
    header="0.2"
    footer="0.2"
  />

</worksheet>`;

  const styles =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">

  <numFmts count="0"/>

  <fonts count="2">

    <font>
      <sz val="11"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>

    <font>
      <b/>
      <sz val="11"/>
      <name val="Microsoft YaHei"/>
      <family val="2"/>
    </font>

  </fonts>

  <fills count="7">

    <fill>
      <patternFill patternType="none"/>
    </fill>

    <fill>
      <patternFill patternType="gray125"/>
    </fill>

    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FFF3F4F6"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>

    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FFFEE2E2"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>

    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FFFEF3C7"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>

    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FFE0E7FF"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>

    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FFDCFCE7"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>

  </fills>

  <borders count="2">

    <border>
      <left/>
      <right/>
      <top/>
      <bottom/>
      <diagonal/>
    </border>

    <border>

      <left style="thin">
        <color rgb="FFD1D5DB"/>
      </left>

      <right style="thin">
        <color rgb="FFD1D5DB"/>
      </right>

      <top style="thin">
        <color rgb="FFD1D5DB"/>
      </top>

      <bottom style="thin">
        <color rgb="FFD1D5DB"/>
      </bottom>

      <diagonal/>

    </border>

  </borders>

  <cellStyleXfs count="1">
    <xf
      numFmtId="0"
      fontId="0"
      fillId="0"
      borderId="0"
    />
  </cellStyleXfs>

  <cellXfs count="7">

    <xf
      numFmtId="0"
      fontId="1"
      fillId="2"
      borderId="1"
      applyAlignment="1"
    >
      <alignment
        horizontal="center"
        vertical="center"
      />
    </xf>

    <xf
      numFmtId="0"
      fontId="1"
      fillId="2"
      borderId="1"
      applyAlignment="1"
    >
      <alignment
        horizontal="center"
        vertical="center"
      />
    </xf>

    <xf
      numFmtId="0"
      fontId="1"
      fillId="2"
      borderId="1"
      applyAlignment="1"
    >
      <alignment
        horizontal="left"
        vertical="center"
      />
    </xf>

    <xf
      numFmtId="0"
      fontId="0"
      fillId="3"
      borderId="1"
      applyAlignment="1"
    >
      <alignment
        horizontal="center"
        vertical="center"
      />
    </xf>

    <xf
      numFmtId="0"
      fontId="0"
      fillId="4"
      borderId="1"
      applyAlignment="1"
    >
      <alignment
        horizontal="center"
        vertical="center"
      />
    </xf>

    <xf
      numFmtId="0"
      fontId="0"
      fillId="5"
      borderId="1"
      applyAlignment="1"
    >
      <alignment
        horizontal="center"
        vertical="center"
      />
    </xf>

    <xf
      numFmtId="0"
      fontId="0"
      fillId="6"
      borderId="1"
      applyAlignment="1"
    >
      <alignment
        horizontal="center"
        vertical="center"
      />
    </xf>

  </cellXfs>

  <cellStyles count="1">
    <cellStyle
      name="Normal"
      xfId="0"
      builtinId="0"
    />
  </cellStyles>

</styleSheet>`;

  const workbook =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">

  <sheets>
    <sheet
      name="排班表"
      sheetId="1"
      r:id="rId1"
    />
  </sheets>

</workbook>`;

  const rels =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">

  <Relationship
    Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"
  />

  <Relationship
    Id="rId2"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
    Target="styles.xml"
  />

</Relationships>`;

  const rootRels =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">

  <Relationship
    Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"
  />

</Relationships>`;

  const contentTypes =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">

  <Default
    Extension="rels"
    ContentType="application/vnd.openxmlformats-package.relationships+xml"
  />

  <Default
    Extension="xml"
    ContentType="application/xml"
  />

  <Override
    PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"
  />

  <Override
    PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"
  />

  <Override
    PartName="/xl/styles.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"
  />

</Types>`;

  return new Blob(
    [
      zipStore([
        {
          name:'[Content_Types].xml',
          data:contentTypes
        },
        {
          name:'_rels/.rels',
          data:rootRels
        },
        {
          name:'xl/workbook.xml',
          data:workbook
        },
        {
          name:'xl/_rels/workbook.xml.rels',
          data:rels
        },
        {
          name:'xl/worksheets/sheet1.xml',
          data:sheetXml
        },
        {
          name:'xl/styles.xml',
          data:styles
        }
      ])
    ],
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  );
}

function downloadBlob(
  blob,
  name
){

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;

  a.download = name;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(url),
    1500
  );
}

$('downloadBtn').onclick =
  () =>
    downloadBlob(
      buildXlsx(),
      `排班表_${state.month}.xlsx`
    );

$('downloadCsvBtn').onclick =
  () =>
    downloadBlob(
      new Blob(
        [resultCSV()],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      ),
      `排班表_${state.month}.csv`
    );

$('copyBtn').onclick =
  async () => {

    try{

      await navigator.clipboard.writeText(
        resultCSV()
      );

      alert(
        '已复制CSV排班结果。'
      );

    }catch(e){

      const ta =
        document.createElement(
          'textarea'
        );

      ta.value =
        resultCSV();

      document.body.appendChild(
        ta
      );

      ta.select();

      document.execCommand(
        'copy'
      );

      ta.remove();

      alert('已复制。');
    }
  };

$('restartBtn').onclick =
$('againBtn').onclick = () => {

  state = {
    month:'',
    days:[],
    holidays:new Set(),
    dutyDates:new Set(),
    olds:[...DEFAULT_OLDS],
    news:[...DEFAULT_NEWS],
    firstDuty:'',
    firstDay:{},
    result:null,
    modified:false
  };

  initMonth();

  showStep(1);
};

$('startBtn').onclick = () => {

  const v =
    $('monthInput').value;

  if(!v){
    alert('请选择月份');
    return;
  }

  state.month =
    v;

  buildDays();

  initHolidays();
  initDutyDates();

  state.firstDay = {};

  state.firstDuty =
    allPeople()[0] || '';

  state.result = null;
  state.modified = false;

  renderHolidayCalendar();

  showStep(2);
};

$('back1').onclick =
  () =>
    showStep(1);

$('back2').onclick = () => {

  renderHolidayCalendar();

  showStep(2);
};

$('back3').onclick = () => {

  renderDutyCalendar();

  showStep(3);
};

$('next2').onclick = () => {

  renderDutyCalendar();

  showStep(3);
};

$('next3').onclick = () => {

  renderPeople();

  showStep(4);

  updatePrecheck();
};

$('addOld').onclick =
  () =>
    addPerson('olds');

$('addNew').onclick =
  () =>
    addPerson('news');

$('generateBtn').onclick =
  generate;

ensureEditDialog();

initMonth();
