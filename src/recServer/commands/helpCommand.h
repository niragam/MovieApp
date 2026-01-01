#ifndef HELPCOMMAND_H
#define HELPCOMMAND_H

#include "ICommand.h"

class helpCommand : public ICommand
{
public:
    void execute(std::istringstream &input, std::ostream &output) override;
};

#endif