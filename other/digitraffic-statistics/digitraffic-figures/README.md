TODO

# DB

    # Create db
    make -f Makefile build_db
    # Start db
    make -f Makefile start_db
    # Remove db
    make -f Makefile clean_docker

Now you can connect to `jdbc:mysql:aws://localhost:33306/dtfigures` with credentials `dtfigures:dtfigures` 
    
