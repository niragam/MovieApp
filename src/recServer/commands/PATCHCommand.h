#ifndef PATCHCOMMAND_H
#define PATCHCOMMAND_H

#include "ICommand.h"
#include "../MovieManager.h"

class PATCHCommand : public ICommand
{
private:
    MovieManager &manager;

public:
    PATCHCommand(MovieManager &manager);
    void execute(std::istringstream &input, std::ostream &output) override;
};

#endif