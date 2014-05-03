/*
 * Simulation.cpp
 *
 *  Created on: 14 Feb 2014
 *      Author: np183
 */

#include <iostream>
#include <sstream>
#include <fstream>
#include <queue>
#include <vector>
#include <deque>
#include <algorithm>
#include <memory>
#include <map>
#include "Directive/Divide.h"
#include "State.h"
#include "Simulation.h"
#include "HelperFunctions.h"

using std::map;
using std::string;
using std::stringstream;
using std::pair;
using std::make_pair;
using std::vector;
using std::deque;
using std::ifstream;
using std::istream;
using std::ostream;
using std::getline;
using std::cerr;
using std::cout;
using std::endl;
using std::size_t;
using std::make_pair;
using std::min;
using std::max;
using std::unique_ptr;
// using boost::lexical_cast;

const int NUMBER_OF_LINES_TO_SKIP{1};
const string DIVIDE{"divide"};
const string DEF_INIT{"default_init"};

bool Simulation::EventPtrComparison::operator() (Happening* lhs, Happening* rhs) const {
	return (rhs->operator<(*lhs));
}

Simulation::Simulation() : _currentTime(0.0) {
}

Simulation::Simulation(const string& filename) : _currentTime(0.0) {
	readFile(filename);
}


Simulation::~Simulation() {
	clear();
	for (auto prog : _programs) {
		delete prog.second;
	}
}

void Simulation::run(const string& initialProg,
					 const string& initialState,
					 float initialMean, float initialSD) {

	// Find the right program
	auto firstProg(_programs.find(initialProg));
	if (firstProg==_programs.end()) {
		string err{"Could not find the initial cell: "};
		err+=initialProg;
		throw err;
	}
	CellProgram* cellProg(firstProg->second);

//	vector<Event*> events(cellProg->firstEvent(_currentTime,state.get()));
	vector<Happening*> happenings(cellProg->firstEvent(_currentTime,initialState,initialMean,initialSD));

	// TODO: Change pointers to unique_pointers!
	std::priority_queue<Happening*, deque<Happening*>, EventPtrComparison> _pending;

	for (auto h : happenings) {
		_pending.push(h);
	}

	while (!_pending.empty()) {
		Happening* current=_pending.top();
		_pending.pop();

		_currentTime = current->execTime();

		// TODO:
		// If you want events to fail then they should throw
		// an exception!
		pair<Event*,vector<Happening*>> nextEvents{current->execute()};
		delete current;

		if (nextEvents.first!=nullptr) {
			_log.push_back(nextEvents.first);
		}

		for (auto h : nextEvents.second) {
			_pending.push(h);
		}
	}
}

void Simulation::clear() {
	for (auto event : _log) {
		delete event;
	}
	_log.clear();

	for (auto cell : _cells) {
		delete cell.second;
	}
	_cells.clear();

	_currentTime=0.0;
}

// There's an implicit assumption here that the first time a name is
// mentioned the cell is born and that the last time the the cell is mentioned
// it dies.
pair<float,bool> Simulation::overlap(const string& name1, const string& name2) const {
	float b1{-1.0},d1{-1.0},b2{-1.0},d2{-1.0};
	for (auto event : _log) {
		if (event->concerns(name1)) {
			if (b1<0.0) {
				b1 = event->execTime();
			}
			else {
				d1 = event->execTime();
			}
		}

		if (event->concerns(name2)) {
			if (b2<0.0) {
				b2 = event->execTime();
			}
			else {
				d2 = event->execTime();
			}
		}
	}

	// TODO: What happens if d1==-1.0 or d2==-1.0 ?????

	// b1 ... d1 ... b2 ... d2 --> d1-b2
	// b1 ... b2 ... d1 ... d2 --> d1-b2
	// b1 ... b2 ... d2 ... d1 --> d2-b2
	return make_pair(min(d1,d2)-max(b2,b1),b1<b2);
}

map<string,unsigned int> Simulation::cellCount() const {
	map<string,unsigned int> ret{};

	for (auto nameCellP : _cells) {
		if (ret.find(nameCellP.first) != ret.end()) {
			ret[nameCellP.first]+=1;
		}
		else {
			ret.insert(make_pair(nameCellP.first,1));
		}
	}
	return ret;
}

void Simulation::readFile(const string& filename) {
	ifstream infile(filename);
	if (infile)
		infile >> *this;
	else {
		string err{"Failed to open file "};
		err+=filename;
		throw err;
	}
}

void Simulation::addCell(Cell* c) {
	_cells.insert(make_pair(c->name(),c));
}

vector<Cell*> Simulation::cells(const string& name) const {
	auto beginEnd=_cells.equal_range(name);
	auto begin=beginEnd.first;
	auto end=beginEnd.second;
	vector<Cell*> ret{};
	for (auto it=begin ; it!= end ; ++it) {
		if (it->second->alive()) {
			ret.push_back(it->second);
		}
	}
	return ret;
}

CellProgram* Simulation::program(const string& name) {
	auto prog(_programs.find(name));
	if (prog == _programs.end()) {
		return nullptr;
	}
	return prog->second;
}

unsigned int Simulation::numPrograms() const {
	return _programs.size();
}

bool Simulation::expressed(const string& cond) const {
	if (cond.find('[')==std::string::npos ||
		cond.find(']')==std::string::npos ||
		cond.find(']') < cond.find('[')) {
		 const string err{"Trying to evaluate a local condition on the simulation."};
		 throw err;
	}

	string var{cond.substr(0,cond.find('['))};
	string cellName{cond.substr(cond.find('[')+1,cond.find(']')-cond.find('[')-1)};

	vector<Cell*> matchingCells{cells(cellName)};
	for (auto cell : matchingCells) {
		if (cell->expressed(var)) {
			return true;
		}
	}
	return false;
}

string Simulation::toString(unsigned int num) const {
	stringstream temp;
	for (auto ev : _log) {
		temp << num << "," << ev->toString() << "\n";
	}

	return temp.str();
}
ostream& operator<< (ostream& out, const Simulation& sim) {
//	for (auto prog : sim._programs) {
//		out << *prog.second << endl;
//	}

	for (auto ev : sim._log) {
		out << *ev << endl;
	}

	return out;
}

istream& operator>> (istream& in, Simulation& sim) {
	int lineNo{1};
	string buffer;

	// Skip the first two lines
	for (; lineNo < NUMBER_OF_LINES_TO_SKIP+1 ; ++lineNo) {
//		cout << "Skipping line number " << lineNo << "\n";
		getline(in,buffer);
	}

	// Every line is a comma separated thing that includes:
	// Cell Name (string), Condition (string), action (string),
	// Daughter 1 (string), State 1 (string), mean time (float), standard deviation (float),
	// Daughter 2 (string), State 2 (string), mean time (float), standard deviation (float),

	// Currently the possible actions are: divide, and default_init
	// For default_init only fields 1,3,5,6,7 are full
	// For divide all fields are applicable
	while (getline(in,buffer) && buffer.size()!=0) {
		 try {
			 sim._sanitize(buffer);
			 sim._parseLine(buffer);
			 ++lineNo;
		 }
		 catch (const string& err) {
			 stringstream error;
			 error << "Error: on line " << lineNo << ":" << err;
			 const string withLineNum{error.str()};
			 throw withLineNum;
		 }
	}
	if (!in.eof()) {
		cerr << "Something went wrong with reading" << endl;
		return in;
	}

//  // This part of the code checks that every program mentioned is defined
//	// But actually, not all programs are defined
//	// The last cells that have no descendants are not defined ...
//	for (auto prog : sim._programs) {
//		for (auto otherprog : prog.second->otherPrograms()) {
//			if (sim._programs.find(otherprog)==sim._programs.end()) {
//				cerr << "Program " << otherprog << " mentioned but does not exist!" << endl;
//				in.setstate(std::ios::failbit);
//				return in;
//			}
//		}
//	}

	in.clear();
	return in;
}

void Simulation::_parseLine(const string& line) {

	// Cell Name (string), Condition (string), action (string),
	// Daughter 1 (string), State 1 (string), mean1 time (float), standard deviation (float),
	// Daughter 2 (string), State 2 (string), mean1 time (float), standard deviation (float),


	string cellName{};
	string condition{};
	string action{};
	string d1{};
	string state1{};
	float mean1{};
	float sd1{};
	string d2{};
	string state2{};
	float mean2{};
	float sd2{};

	const vector<string> fields{splitOn(',',line)};

	// cout << "Read: " << buffer << endl;

	for (unsigned int i=0 ; i<static_cast<unsigned int>(LASTDELIM) && i<fields.size() ;
		 ++ i) {
		const string piece{fields.at(i)};

		switch (static_cast<CsvFields>(i)) {
		case NAME:
		{
			cellName = piece;
		}
		break;
		case CONDITION: {
			condition = piece;
		}
		break;
		case ACTION:
		{
			action = piece;
		}
		break;
		case DAUGHTER1: // Daughter 1
		{
			d1 = piece;
		}
		break;
		case STATE1:
		{
			state1 = piece;
		}
		break;
		case MEANTIME1: // Mean time
		{
			mean1=_readFloat(piece);
		}
		break;
		case STANDARDDEV1: // Standard Deviation
		{
			sd1=_readFloat(piece);
		}
		break;
		case DAUGHTER2:
		{
			d2 = piece;
		}
		break;
		case STATE2:
		{
			state2 = piece;
		}
		break;
		case MEANTIME2: // Mean time
		{
			mean2=_readFloat(piece);
		}
		break;
		case STANDARDDEV2: // Standard Deviation
		{
			sd2=_readFloat(piece);
		}
		break;
		default:
		{
			const string err{"Too many fields."};
			throw err;
		}
		}
	}

	auto progIt=_programs.find(cellName);
	if (progIt==_programs.end()) {
		CellProgram* newProg=new CellProgram(cellName,this);
		_programs.insert(make_pair(cellName,newProg));
		progIt=_programs.find(cellName);
	}

	unique_ptr<Condition> cond{(condition.size()==0 ? nullptr : new Condition(condition))};
	if (DIVIDE==action) {
		State* st1{(state1.size()==0 ? nullptr : new State(state1))};
		State* st2{(state2.size()==0 ? nullptr : new State(state2))};
		Directive* d{new Divide(progIt->second,d1,st1,mean1,sd1,d2,st2,mean2,sd2)};
		progIt->second->addCondition(cond.release(),d);
	}
	else if (DEF_INIT==action) {
		if (mean2!=-1.0 || sd2!=-1.0 || state2.size()!=0 || cond!=nullptr) {
			const string err{"Badly structured default initialization."};
			throw err;
		}
		State* st1{(state1.size()==0 ? nullptr : new State(state1))};
		progIt->second->setDefaults(st1,mean1,sd1);
	}
	else {
		const string err{"Unexpected action."};
		throw err;
	}
}

float Simulation::_readFloat(const string& input) const {
	if (input.size()==0) {
		return -1.0;
	}
	std::stringstream str(input);
	float ret{};
	str >> ret;
	if (!str) {
		const string err{"Expecting a number for mean time."};
		throw err;
	}
	return ret;
}

bool notIsPrint (char c)
{
    return !isprint((unsigned)c);
}

void Simulation::_sanitize(string & str)
{
    str.erase(remove_if(str.begin(),str.end(), notIsPrint) , str.end());
}

//pair<string,State*> Simulation::_parseCellWithState(const std::string& cell) const {
//	if (cell.find('[')==string::npos) {
//		return make_pair(cell,nullptr);
//	}
//	string stateStr{cell.substr(cell.find('[')+1,cell.find(']')-cell.find('[')-1)};
//	State* state{new State(stateStr)};
//	string cellName{cell.substr(0,cell.find('['))};
//
//	return make_pair(cellName,state);
//}
