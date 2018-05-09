function v2n(v) {
    var ns = v.slice(0, 5).split(".");
    var sum = 0;
    for (var i = 0; i < ns.length; i++) {
        sum += ns[i] * Math.pow(10, ns.length - i - 1);
    }
    return sum;
}
//create element with class, innerHTML
function ce(name, className, inner) {
    var ele = document.createElement(name);
    if (className) ele.className = className;
    if (inner) ele.innerHTML = inner;
    return ele;
}

function $(id) {
    return document.getElementById(id);
}

var container = $("container"),
    banner = $("banner"),
    bs1 = $("bs1"),
    bs3 = $("bs3"),
    search = window.location.search;
if (search === "") search = "?version=1.0.3"; //针对(Android&iOS)1.0.3版本的特殊处理
var version = v2n(search.slice(search.lastIndexOf("=") + 1));

bs3.ontouchend = function(e) {
    e.stopPropagation();
    banner.style.display = "none";
}

function addContents(contents) {
    var i = 0,
        len = Math.min(contents.length, 10); //最多显示10条
    for (; i < contents.length; i++) {
        if (v2n(contents[i].version) <= version) break;
    }
    //当前版本不是最新版本时,给出banner提示
    if (i > 0) {
        bs1.innerHTML = "有新版本" + contents[0].version;
        banner.style.display = "block";
    }
    for (; i < len; i++) {
        var content = contents[i];
        if (v2n(content.version) > version) continue;
        var divV = ce("div", "v");

        var divVersion = ce("div", "version", content.version);
        divVersion.appendChild(ce("span", "date", content.date));
        divV.appendChild(divVersion);

        addNOB(divV, "新增", content.news);
        addNOB(divV, "优化", content.optimizations);
        addNOB(divV, "修复", content.bugs);

        container.appendChild(divV);
    }
}
//add `news` or `optimizations` or `bugs`
function addNOB(divV, type, items) {
    if (items) {
        divV.appendChild(ce("div", "desc", type));
        divV.appendChild(createOL(items));
    }
}

function createOL(items) {
    var olContent = ce("ol", "content");
    for (var key in items) {
        olContent.appendChild(ce("li", "item", items[key]));
    }
    return olContent;
}
