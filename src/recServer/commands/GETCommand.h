#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include "ICommand.h"
#include "../MovieManager.h"

class GETCommand : public ICommand
{
private:
    MovieManager &manager;

public:
    GETCommand(MovieManager &manager);
    void execute(std::istringstream &input, std::ostream &output) override;
};

#endif