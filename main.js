/////////////////////////////////////////////////////////////////////////////////////
// Лабораторная работа 2 по дисциплине ЛОИС
// Выполнена студентом группы 721701 БГУИР Стома Кирилл
// В файле содержатся функции разбора формулы, проверки ее соответствию грамматике и получения
// всех фиктивных пропозициональных переменных
// 19.04.2020

let _atoms;
let _sets;
let _results;

function encountDummyVars(formula) {
    let uniqueAtoms = getUniqueAtoms(formula);

    let sets = getValueSets(uniqueAtoms);
    let results = getFunctionResults(formula, uniqueAtoms, sets);
    let dummies = getDummyVars(formula, uniqueAtoms, sets);

    _atoms = uniqueAtoms;
    _sets = sets;
    _results = results;

    return dummies;
}

function getFunctionResults(formula, atoms, sets) {
    let results = [];
    sets.forEach(set => {
        let addedFormula = addValues(set, atoms, formula);
        let formulaValue = getFormulaValue(addedFormula);
        results.push(formulaValue);
    });
    
    return results;
}

function drawTruthTable(truthTableElement) {
    truthTableElement.innerHTML = _atoms.join(' | ') + ' | f()<br><hr>';
    _sets.forEach((set, index) => {
        truthTableElement.innerHTML += set.join(' | ') + ' | ' + _results[index] + '<br>';
    });
}

function getUniqueAtoms(formula) {
    return [...new Set(formula.split(/[^A-Z]/).filter(atom => atom !== ''))];
}

function addValues(values, atoms, formula) {
    for (i = 0; i < atoms.length; i++) {
        formula = formula.replace(new RegExp(atoms[i], 'g'), values[i]);
    }

    return formula;
}

function getFormulaValue(formula) {
    while (!formula.match(/^[01]$/g)) {
        formula = calcNegation(formula);
        formula = calcConjunction(formula);
        formula = calcDisjunction(formula);
        formula = calcEquivalence(formula);
        formula = calcImplication(formula);
    }

    return formula;
}

function calcConjunction(formula) {
    formula = formula.replace(/\(1&1\)/g, '1');
    formula = formula.replace(/\(0&1\)|\(1&0\)|\(0&0\)/g, '0');

    return formula;
}

function calcNegation(formula) {
    formula = formula.replace(/\(!1\)/g, '0');
    formula = formula.replace(/\(!0\)/g, '1');

    return formula;
}

function calcDisjunction(formula) {
    formula = formula.replace(/\(0\|0\)/g, '0');
    formula = formula.replace(/\(0\|1\)|\(1\|0\)|\(1\|1\)/g, '1');

    return formula;
}

function calcEquivalence(formula) {
    formula = formula.replace(/\(1~1\)|\(0~0\)/g, '1');
    formula = formula.replace(/\(1~0\)|\(0~1\)/g, '0');

    return formula;
}

function calcImplication(formula) {
    formula = formula.replace(/\(1->0\)/g, '0');
    formula = formula.replace(/\(0->1\)|\(1->1\)|\(0->0\)/g, '1');

    return formula;
}

function getDummyVars(formula, atoms, sets) {
    let dummyVars = [];
    
    atoms.forEach((atom, index) => {
        let actualResults = [];
        let dummyResults = [];

        sets.forEach(set => {
            let dummySet = [];
            set.forEach(value => dummySet.push(value));
            dummySet[index] = '0';

            let dummyAddedValues = addValues(dummySet, atoms, formula);
            let actualAddedValues = addValues(set, atoms, formula);

            dummyResults.push(getFormulaValue(dummyAddedValues));
            actualResults.push(getFormulaValue(actualAddedValues));
        });

        if (dummyResults.every((result, index) => result === actualResults[index])) {
            dummyVars.push(atom);
        }
    });

    return dummyVars;
}

// Автор - Семенихин Н.
function getValueSets( atoms) {
    let sets = [];

    for (let indexSet = 0; indexSet < Math.pow(2, atoms.length); indexSet++) {
        let indexSetBinary = Array.from(indexSet.toString(2));
        if (indexSetBinary.length !== atoms.length) {
            let zerosLeft = Array.from('0'.repeat(atoms.length - indexSetBinary.length));
            indexSetBinary.forEach(digit => zerosLeft.push(digit));

            indexSetBinary = zerosLeft;
        }

        sets.push(indexSetBinary);
    }

    return sets;
}

function encount(formula) {
    let messageElement = document.getElementById('message');
    let dummiesElement = document.getElementById('dummies');
    let truthTableElement = document.getElementById('truthTable');
    truthTableElement.innerHTML = '';
    dummiesElement.innerHTML = '';

    if (!(checkAllSymbolsCorrect(formula) && checkSyntaxValid(formula))) {
        messageElement.innerHTML = "Введенная строка не является формулой";
        return;
    }
    
    let dummies = encountDummyVars(formula);

    if (dummies.length !== 0) {
        messageElement.innerHTML = "Фиктивные пропозициональные переменные: ";
        drawTruthTable(truthTableElement);
    } else {
        messageElement.innerHTML = "Фиктивные пропозициональные переменные отсутствуют";
    }

    dummiesElement.innerHTML = [...dummies];
}

function checkAllSymbolsCorrect(formula) {
    return formula.match(/^([10A-Z()|&!~]|->)*$/g);
}

function checkBracketsPairs(formula) {
    let openBrackets = formula.split('(').length - 1;
    let closedBrackets = formula.split(')').length - 1;
    
    return openBrackets == closedBrackets;
}

function checkOperBrackets(formula) {
    let copy = formula;

    while (copy.match(/([|&~]|->)/g) || !copy.match(/^[A()]+$/g)) {
        let prevCopy = copy;

        copy = copy.replace(/\(![A-Z01]\)/g, 'A');
        copy = copy.replace(/\([A-Z01]([|&~]|->)[A-Z01]\)/g, 'A');

        if (copy === prevCopy) return false;
    }

    return copy === 'A';
}

function checkSyntaxValid(formula) {
    return formula.match(/^[A-Z10]$/) ||
        (!formula.match(/\)\(/) && !formula.match(/[A-Z10]([^|&~]|(?!->))[10A-Z]/) &&
        !formula.match(/[^(]![A-Z10]/) && !formula.match(/![A-Z10][^)]/) &&
        !formula.match(/\([A-Z10]\)/) && checkBracketsPairs(formula) && checkOperBrackets(formula));
}

/// tests

class Question {
    constructor(formula, answer) {
        this.formula = formula;
        this.answer = answer;
    }
}

var atomsForTest = [ 'X', 'Y', 'Z' ];

var currentQuestion;
var countOfQuestions = 10;
var currentQuestionIndex = 0;
var correctAnswers = 0;
var testSection;
var resultSection = document.getElementById('resultSection');

function startTest() {
    testSection = document.getElementById('testSection');
    let startButton = document.getElementById('startButton');

    testSection.style.display = 'flex';
    startButton.style.display = 'none';

    currentQuestion = createQuestion();

    rewriteFormula();
    clearAnswerInput();
}

function next() {
    let currentAnswer = document.getElementById("answerInput").value.split(',').filter(atom => atom !== '');
    let isCorrectAnswered = (currentAnswer.length === currentQuestion.answer.length) && 
        (currentQuestion.answer.every(atom => currentAnswer.indexOf(atom) !== -1));

    if (isCorrectAnswered) {
        correctAnswers++;
    }

    ++currentQuestionIndex;
    if (currentQuestionIndex === countOfQuestions) {
        document.getElementById('score').innerHTML = 'Оценка: ' + 10 * correctAnswers / countOfQuestions;

        testSection.style.display = 'none';
        resultSection.style.display = 'flex';
        return;
    }

    currentQuestion = createQuestion();

    rewriteFormula();
    clearAnswerInput();
}

function createQuestion() {
    let countOfArgs = random(2);
    let countOfGroups = random(Math.pow(2, countOfArgs));

    let formula = generateFormula(countOfGroups, countOfArgs);
    let answer = encountDummyVars(formula);

    return new Question(formula, answer);
}

function random(max) {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
}

// Автор Семенихин Н.С.
function generateFormula(countOfGroups, countOfArgs) {
    let formula = '';
    let atoms = atomsForTest;

    for (i = 0; i < countOfGroups; i++) {
        let countOfArgsInParticualarGroup = countOfArgs - random(countOfArgs) + 2;
        let group = '';

        if (countOfGroups !== 1 && i < countOfGroups - 1) {
            formula += '(';
        }

        let willRepeat = false;
        let willBeOne = (Math.random() >= 0.5);

        if (willBeOne) {
            formula += atomsForTest[random(2)];
        } else {
            for (j = 0; j < countOfArgsInParticualarGroup; j++) {
                let currAtom = atoms[j];
    
                if (willRepeat) {
                    currAtom = atoms[j - 1];
                }
                if (countOfArgsInParticualarGroup !== 1 && j < countOfArgsInParticualarGroup - 1) {
                    group += '(';
                }
    
                let isNegative = (Math.random() >= 0.5);
                willRepeat = isNegative;
                group += (isNegative ? '(!' : '') + currAtom + (isNegative ? ')' : '');
                if (j < countOfArgsInParticualarGroup - 1) {
                    let random  = Math.random();
                    group += ((random >= 0.3) ? '|' : (random >= 0.2 ? '&' : (random >= 0.1 ? '~' : '->')));
                }
            }
    
            for (j = 0; j < countOfArgsInParticualarGroup - 1; j++) {
                if (countOfArgsInParticualarGroup !== 1) {
                    group += ')';
                }
            }
    
            formula += group;
        }        

        if (i < countOfGroups - 1) {
            let random  = Math.random();
            formula += ((random >= 0.3) ? '|' : (random >= 0.2 ? '&' : (random >= 0.1 ? '~' : '->')));
        }
    }

    for (j = 0; j < countOfGroups - 1; j++) {
        if (countOfGroups !== 1) {
            formula += ')';
        }
    }

    return formula;
}

function rewriteFormula() {
    document.getElementById('formula').innerHTML = currentQuestion.formula;
}

function clearAnswerInput() {
    document.getElementById("answerInput").value = '';
}