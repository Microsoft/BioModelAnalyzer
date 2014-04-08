/*
 * Directive.cpp
 *
 *  Created on: 25 Mar 2014
 *      Author: np183
 */

#include "Directive.h"

std::random_device Directive::_randomDev{};
std::mt19937 Directive::_randomGen{Directive::_randomDev()};

Directive::Directive(float m, float s, CellProgram* c) : _mean(m), _sd(s), _cProg(c) {
}

Directive::~Directive() {
}


float Directive::_randomTime(const float& mean, const float& sd) const {
	std::normal_distribution<> d(mean,sd);
	return d(_randomGen);
}

float Directive::_randomTime() const {
	return _randomTime(_mean,_sd);
}
