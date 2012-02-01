/*
 * HAProxy configuration book builder for LaTeX
 * run it in node.js
 * $ node make.js
 *
 */

var fs = require('fs');
var mkdirp = require('mkdirp').sync;

// regexp
var caption = /^((\d+\.?)+)\s*([^\n]+)\n-+(?:\n[ \t]*)+/mg;

var QUOTES = {
	"defaults": '\\keyword{defaults}',
	"frontend": '\\keyword{frontend}',
	"backend": '\\keyword{backend}',
	"listen": '\\keyword{listen}',
	"block": '\\keyword{block}',
	"use\\_backend": '\\keyword{use\\_backend}',
};

var text = module.exports.text = fs.readFileSync('configuration.txt','utf8');

text = text.replace(/\t/g,'        ');

var split_chapters = module.exports.split_chapters = function(text) {
	var parts = [];
	var prev_part = {
		chapter: 'Summary',
		chapterparts: [],
		title: 'Summary',
	};
	parts.push(prev_part);

	var prev_start = 0;
	text.replace(caption, function(m, chapternum, space, title, offset) {
		if(prev_part !== null) {
			prev_part.text = text.slice(prev_start, offset);
		}
		parts.push(prev_part = {
			chapter: chapternum,
			chapterparts: chapternum.split(/[^\d]+/).filter(function(x) { return x.trim() !== ''; }),
			title: title,
		});
		prev_start = offset + m.length;
		return m;
	});
	prev_part.text = text.slice(prev_start); // to the end

	return parts;
};


var hasIndents = function(text) { // identify tables too
	return text.match(/^(  |----+)/mg) !== null;
};


var special_char = /(>>>|[#$%&~_^\\{}<>])/g;
var plainParagraph = function(text) {
	var t = text;
	t = t.replace(special_char, function(special) {
		if(special === '\\')
			return '\\bslash ';
		else if(special === '<')
			return '$<$';
		else if(special === '>')
			return '$>$';
		else if(special === '>>>')
			return '\\gttt ';
		return '\\'+special;
	});

	t = t.replace(/\$<\$(\w+( \w+)*)\$>\$/g, function(m, n) {
		return '\\param{' + n.replace(' ','~') + '}';
	});

	t = t.replace(/"(-.{1,5})"/g, function(m, n) {
		return '\\cmdarg{' + n.replace(' ','~') + '}';
	});

	t = t.replace(/\('(.{1,5})'\)/g, function(m, n) {
		return '\\CHAR{' + n.replace(' ','~') + '}';
	});
	t = t.replace(/'(.{1,5})'/g, function(m, n) {
		return '\\CHAR{' + n.replace(' ','~') + '}';
	});


	t = t.replace(/"(\w+((\\_|\s+)\w+)*)"/g, function(m, n) {
		if(typeof QUOTES[n] === 'string')
			return QUOTES[n];
		return '\\emph{' + n + '}';
	});

	return t;
};


var processPlainText = function(text) {
	var i,l,sb = [];
	var par, paragraphs = text.split(/\n(?:\w*\n)+/);

	for(i=0, l=paragraphs.length; i<l; i++) {
		par = paragraphs[i];
		if(par.trim() == '')
			continue;

		if(hasIndents(par)) {
			sb.push('\\begin{verbatim}\n');
			sb.push(par);
			sb.push('\n\\end{verbatim}\n\n');
		} else {
			sb.push('\n');
			sb.push(plainParagraph(par));
			sb.push('\n\n');
		}
	}

	return sb.join('');
};


var getTeXContent = function(part) {
	var sb = [];
	sb.push('% This is generated content\n');
	sb.push('% Section ', part.chapter, '\n');
	switch(part.chapterparts.length) {
		case 0:
			sb.push('\n\\chapter*{', part.title, '}\n');
			break;
		case 1:
			sb.push('\n\\chapter{', part.title, '}\n');
			break;
		case 2:
			sb.push('\n\\section{', part.title, '}\n');
			break;
		case 3:
			sb.push('\n\\subsection{', part.title, '}\n');
			break;
		default:
			sb.push('\n\\subsubsection{', part.title, '}\n');
			break;
	}

	sb.push(processPlainText(part.text));

	return sb.join('');
};


var writeFiles = module.exports.writeFiles = function(parts) {
	var i, l, filenamebase, part, includes = [], inputs = [];
	for(i=0, l=parts.length; i<l; i++) {
		part = parts[i];
		filenamebase = 'gen_' + part.chapterparts.map(function(p) {
				return p.length === 1 ? '0'+p : p;
			}).join('-') + '--' + part.title.toLowerCase().replace(/[^a-z-]+/g,'-');

		fs.writeFileSync('tex/'+filenamebase+'.tex', getTeXContent(part), 'utf8');

		includes.push(filenamebase);
		inputs.push('\\input{',filenamebase,'.tex}\n');
	}

	fs.writeFileSync('tex/gen_chapters.tex', inputs.join(''), 'utf8');

	return includes;
};


// tex generation here:

var parts = split_chapters(text);
var filenames = writeFiles(parts);

// write out part files:
filenames.forEach(function(fname){
	console.log(fname);
});



/*
var escaped_text = text.replace(special_char, function(special){
	if(special === '\\')
		return '\\bslash ';
	else if(special === '<')
		return '$<$';
	else if(special === '>')
		return '$>$';
	else if(special === '>>>')
		return '\\gttt ';
	return '\\'+special;
});



var seccount = /\d+/g;
var caption = /\n\n((\d+\.?)+)\s*([^\n]+)\n-+\s*\n/g;
var chaptered = escaped_text.replace(caption, function(m, num, a, title,b){
	console.log(num+'::'+title, b);
	var len = num.match(seccount);
	len = len === null ? 0 : l.length;
	switch() {
		case 0:
			return '\n%'+num+'\n\\subsubsection{'+title+'}\n\n';
		case 1:
			return '\n%'+num+'\n\\chapter{'+title+'}\n\n';
		case 2:
			return '\n%'+num+'\n\\section{'+title+'}\n\n';
		case 3:
			return '\n%'+num+'\n\\subsection{'+title+'}\n\n';
	}
	return m;
});

var line_delim = /\n\s*-+\s*\n/g;
var result = chaptered.replace(line_delim, '\n\\hrule\n\n');

fs.writeFileSync('configuration.tex', result, 'utf8');

*/
