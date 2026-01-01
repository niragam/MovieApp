#ifndef ICOMMAND_H
#define ICOMMAND_H

#include <sstream>


class ICommand {
public:
    virtual ~ICommand() = default;
    virtual void execute(std::istringstream &input, std::ostream &output) = 0;
};

#endif