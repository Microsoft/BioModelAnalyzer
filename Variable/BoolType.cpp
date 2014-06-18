#include <typeinfo>
#include "BoolType.h"

using std::string;

BoolType::BoolType()
{
}


BoolType::~BoolType()
{
}

BoolType& BoolType::getInstance() {
	static BoolType theBT;
	return theBT;
}

bool BoolType::operator==(const Type& other) const {
	return (this == &other);
}

BoolType::Value::Value(const bool val) : _val(val) {

}

BoolType::Value::~Value() 
{
}

bool BoolType::Value::value() const {
	return _val;
}

const Type& BoolType::Value::type() const {
	return BoolType::getInstance();
}

Type::Value* BoolType::Value::duplicate() const {
	return new BoolType::Value(*this); 
}

bool BoolType::Value::operator==(const Type::Value& other) const {
	if (typeid(*this) != typeid(other)) {
		return false;
	}
	const Value& bOther(dynamic_cast<const Value&>(other));
	return bOther._val == this->_val;
}

string BoolType::Value::toString() const {
	if (_val) {
		return "TRUE"; 
	}
	return "FALSE";
}