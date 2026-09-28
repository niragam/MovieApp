#ifndef ICOMMAND_H
#define ICOMMAND_H

#include <sstream>


class ICommand {
public:
    virtual ~ICommand() = default;
    virtual void execute(std::istringstream &input, std::ostream &output) = 0;
    // Whether the command can change stored data (the server persists only after these).
    virtual bool mutates() const { return false; }
};

#endif
