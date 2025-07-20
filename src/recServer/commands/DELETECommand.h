#ifndef DELETECOMMAND_H
#define DELETECOMMAND_H

#include "ICommand.h"
#include "../MovieManager.h"

class DELETECommand : public ICommand
{
private:
    MovieManager &manager;

public:
    DELETECommand(MovieManager &manager);
    void execute(std::istringstream &input, std::ostream &output) override;
};

#endif